"""Local Apple Silicon speech runner. Dependencies: requirements.txt beside this file."""
import argparse
import os
from pathlib import Path
import re


def chunks(text, limit=280):
    """Keep sentences together where possible; bound long sentences at word boundaries."""
    current = ""
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", text.strip()):
        for word in sentence.split():
            if current and len(current) + len(word) + 1 > limit:
                yield current
                current = ""
            current = f"{current} {word}".strip()
        if len(current) >= limit // 2:
            yield current
            current = ""
    if current:
        yield current


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--reference", required=True)
    parser.add_argument("--language", choices=["tr", "en"], default="tr")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    os.environ.setdefault("HF_HOME", str(root / "data/chatterbox-cache"))
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    import mlx.core as mx
    import numpy as np
    from scipy.io.wavfile import write
    from mlx_audio.tts.utils import load_model

    model = load_model("mlx-community/chatterbox-multilingual-v3")
    mx.random.seed(42)
    conditioning = model.prepare_conditionals(args.reference, ref_sr=model.sample_rate, exaggeration=0.1)
    segments = []
    for part in chunks(Path(args.input).read_text(encoding="utf-8")):
        for result in model.generate(
            text=part, conds=conditioning, lang_code=args.language,
            exaggeration=0.1, temperature=0.7, max_new_tokens=1000,
            verbose=False,
        ):
            audio = np.asarray(result.audio).reshape(-1)
            if not audio.size or not np.isfinite(audio).all():
                raise RuntimeError("Invalid audio generated")
            # A bounded chunk reaching the generation ceiling likely failed to stop.
            if audio.size / model.sample_rate >= 39:
                raise RuntimeError("Speech chunk reached its length limit; shorten the text")
            if segments:
                segments.append(np.zeros(int(model.sample_rate * 0.3), dtype=np.float32))
            segments.append(audio)
        mx.clear_cache()
    if not segments:
        raise RuntimeError("No speech generated")
    pcm = (np.clip(np.concatenate(segments), -1, 1) * 32767).astype(np.int16)
    write(args.output, model.sample_rate, pcm)


if __name__ == "__main__":
    main()
