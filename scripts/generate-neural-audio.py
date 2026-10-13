"""Generate public built-in clips locally. Never read the user's learning database.

Usage: python scripts/generate-neural-audio.py --output <build-dir> [--limit 6]
Install kokoro==0.9.4, misaki[en]==0.9.4, soundfile, lameenc in an isolated runtime.
The model is downloaded from its publisher, hexgrad/Kokoro-82M (Apache-2.0).
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
VOICE = "bf_emma"


def normalize(text):
    return re.sub(r"\s+", " ", text.strip()).replace("’", "'").replace("‘", "'").lower()


def public_texts():
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    pack = json.loads(re.search(r"const AUDIO_PACK=(\{[^\n]+\});", source)[1])
    words = json.loads(re.search(r"const WANG807=(\[[^\n]+\]);", source)[1])
    texts = {key: key for key in pack}
    for word in words:
        texts[normalize(word["en"])] = word["en"]
        example = (word.get("example") or {}).get("en", "")
        if example:
            texts[normalize(example)] = example
    sample = "Hello. Let us practise English."
    texts[normalize(sample)] = sample
    priority = ["archaeological", "environment", "the team found pottery at an archaeological site.", normalize(sample)]
    return {key: texts[key] for key in priority + [key for key in texts if key not in priority]}


def corrected_text(text, rules):
    applied = []
    for word, rule in rules["words"].items():
        pattern = re.compile(r"(?<![A-Za-z])" + re.escape(word) + r"(?![A-Za-z])", re.I)
        if pattern.search(text):
            applied.append(word)
            text = pattern.sub(lambda m: "[" + m[0] + "](/" + rule["phonemes"] + "/)", text)
    # A sentence boundary stabilises isolated words; no extra spoken carrier phrase.
    if not re.search(r"[.!?]$", text):
        text += "."
    return text, applied


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--espeak-data", type=Path, help="Optional ASCII data path for Windows espeak DLLs")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    import numpy as np
    import lameenc
    import torch
    from kokoro import KPipeline
    if args.espeak_data:
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_data_path(str(args.espeak_data.resolve()))

    args.output.mkdir(parents=True, exist_ok=True)
    clips_dir = args.output / "clips"
    clips_dir.mkdir(exist_ok=True)
    rules = json.loads((ROOT / "scripts/pronunciation-overrides.json").read_text(encoding="utf-8"))
    texts = public_texts()
    if args.limit:
        texts = dict(list(texts.items())[:args.limit])
    journal = args.output / "clips.jsonl"
    completed = {}
    if journal.exists():
        for line in journal.read_text(encoding="utf-8").splitlines():
            clip = json.loads(line)
            file = clips_dir / Path(clip["url"]).name
            if file.exists() and hashlib.sha256(file.read_bytes()).hexdigest() == clip["sha256"]:
                completed[clip["key"]] = clip
    torch.set_num_threads(4)
    print("Loading Kokoro-82M / bf_emma; GPU:", torch.cuda.is_available(), flush=True)
    pipeline = KPipeline(lang_code="b", repo_id="hexgrad/Kokoro-82M", trf=False)
    if pipeline.g2p.fallback is None:
        raise RuntimeError("English out-of-dictionary fallback is unavailable; refusing partial pronunciations")
    started = time.time()
    with journal.open("a", encoding="utf-8") as log:
        for index, (key, text) in enumerate(texts.items(), 1):
            prepared, overrides = corrected_text(text, rules)
            fingerprint = hashlib.sha256(json.dumps(["Kokoro-82M-v1.0", VOICE, prepared, 1, rules["version"]], ensure_ascii=False).encode()).hexdigest()
            if key in completed and completed[key].get("inputHash") == fingerprint:
                continue
            results = list(pipeline(prepared, voice=VOICE, speed=1, split_pattern=r"\n+"))
            phonemes = " ".join(result.phonemes for result in results)
            if not phonemes.strip() or "❓" in phonemes or "�" in phonemes:
                raise RuntimeError("Missing pronunciation: " + key)
            chunks = [result.audio.detach().cpu().numpy() for result in results if result.audio is not None]
            if len(chunks) != len(results) or not chunks:
                raise RuntimeError("Missing generated audio: " + key)
            audio = np.concatenate(chunks).astype(np.float32)
            # Keep consonant edges and a short natural boundary, remove only near-silence.
            audible = np.flatnonzero(np.abs(audio) > 0.0003)
            if not len(audible):
                raise RuntimeError("Silent clip: " + key)
            audio = audio[max(0, audible[0] - 1680): min(len(audio), audible[-1] + 3361)]
            peak = float(np.max(np.abs(audio)))
            if peak < .02 or not .25 <= len(audio) / 24000 <= 45:
                raise RuntimeError("Invalid clip level or duration: " + key)
            audio *= min(3.0, .92 / peak)
            pcm = (np.clip(audio, -.99, .99) * 32767).astype("<i2")
            encoder = lameenc.Encoder()
            encoder.set_bit_rate(64)
            encoder.set_in_sample_rate(24000)
            encoder.set_channels(1)
            encoder.set_quality(2)
            encoded = encoder.encode(pcm.tobytes()) + encoder.flush()
            digest = hashlib.sha256(encoded).hexdigest()
            name = digest[:24] + ".mp3"
            (clips_dir / name).write_bytes(encoded)
            clip = {"key": key, "text": text, "url": "/assets/" + name, "sha256": digest,
                    "duration": round(len(audio) / 24000, 4), "phonemes": phonemes, "overrides": overrides,
                    "inputHash": fingerprint}
            log.write(json.dumps(clip, ensure_ascii=False) + "\n")
            log.flush()
            completed[key] = clip
            if index <= 4 or index % 50 == 0 or index == len(texts):
                print(f"Generated {index}/{len(texts)} in {time.time()-started:.1f}s", key if index <= 4 else "", flush=True)
    manifest = {"version": 1, "engine": "Kokoro-82M", "model": "v1.0", "voice": VOICE,
                "language": "en-GB", "speed": 1, "sampleRate": 24000, "license": "Apache-2.0",
                "modelSource": "https://huggingface.co/hexgrad/Kokoro-82M", "overrideVersion": rules["version"],
                "clips": [completed[key] for key in texts]}
    (args.output / "neural-audio-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Complete:", len(manifest["clips"]), "clips", flush=True)


if __name__ == "__main__":
    main()
