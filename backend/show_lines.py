from app.services.ocr_service import extract_text_with_data

image = "processed/9df19fba-ddfc-4766-88dc-96bcaa907fcd_processed.jpg"

result = extract_text_with_data(image)

print("\n========== OCR LINES ==========\n")

for line in result["lines"]:
    print(
        f"{line['confidence']:5.1f}  {line['text']}"
    )

print("\n========== SUMMARY ==========")
print("Time test completed")
print("Confidence:", result["average_confidence"])
print("Words:", result["word_count"])
print("Lines:", len(result["lines"]))
print("Passes:", result["candidates_tested"])