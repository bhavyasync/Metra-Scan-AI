from functools import lru_cache

from paddleocr import PaddleOCR


@lru_cache(maxsize=1)
def get_ocr():
    return PaddleOCR(
        use_doc_orientation_classify=True,
        use_doc_unwarping=True,
        use_textline_orientation=True,
    )


def _to_list(value):
    if value is None:
        return []

    if hasattr(value, "tolist"):
        return value.tolist()

    return value


def _normalize_box(box):
    box = _to_list(box)

    if len(box) == 4 and all(
        isinstance(v, (int, float))
        for v in box
    ):
        x1, y1, x2, y2 = box
        return [x1, y1, x2, y2]

    points = box

    xs = [
        point[0]
        for point in points
    ]

    ys = [
        point[1]
        for point in points
    ]

    return [
        min(xs),
        min(ys),
        max(xs),
        max(ys),
    ]


def extract(image_path: str):

    ocr = get_ocr()

    results = ocr.predict(
        image_path
    )

    words = []

    for result in results:

        data = result.json

        # PaddleOCR versions can differ slightly,
        # so normalize defensively.

        if isinstance(data, str):
            import json

            data = json.loads(data)

        res = data.get("res", data)

        texts = (
            _to_list(
                res.get("rec_texts")
            )
            or
            _to_list(
                res.get("rec_text")
            )
            or
            []
        )

        scores = (
            _to_list(
                res.get("rec_scores")
            )
            or
            []
        )

        boxes = (
            _to_list(
                res.get("rec_boxes")
            )
            or
            _to_list(
                res.get("dt_polys")
            )
            or
            []
        )

        for index, text in enumerate(texts):

            text = str(text).strip()

            if not text:
                continue

            confidence = 0.0

            if index < len(scores):
                try:
                    confidence = float(
                        scores[index]
                    )
                except (
                    ValueError,
                    TypeError,
                ):
                    confidence = 0.0

            bbox = None

            if index < len(boxes):
                bbox = _normalize_box(
                    boxes[index]
                )

            words.append({
                "text": text,
                "confidence": confidence,
                "bbox": bbox,
                "engine": "paddleocr",
            })

    return {
        "engine": "paddleocr",
        "words": words,
        "text": " ".join(
            item["text"]
            for item in words
        ),
    }