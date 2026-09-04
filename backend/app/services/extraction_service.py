import re


class ExtractionService:

    def extract(self, text: str):

        data = {
            "mrp": None,
            "net_quantity": None,
            "packed_date": None,
            "manufacturer": None,
            "consumer_care": None
        }


        mrp_pattern = (
            r"(?:MRP|M\.R\.P\.?)"
            r"[\s:₹Rs\.]*"
            r"(\d+(?:\.\d{1,2})?)"
        )

        mrp_match = re.search(
            mrp_pattern,
            text,
            re.IGNORECASE
        )

        if mrp_match:

            data["mrp"] = (
                mrp_match.group(1)
            )


        quantity_pattern = (
            r"(\d+(?:\.\d+)?)"
            r"\s*"
            r"(kg|g|gm|ml|l|litre|litres)"
        )

        quantity_match = re.search(
            quantity_pattern,
            text,
            re.IGNORECASE
        )

        if quantity_match:

            data["net_quantity"] = {
                "value":
                    quantity_match.group(1),

                "unit":
                    quantity_match.group(2)
            }


        date_pattern = (
            r"(?:MFD|PKD|Packed|Manufactured)"
            r"[\s:.-]*"
            r"(\d{2}[/-]\d{4})"
        )

        date_match = re.search(
            date_pattern,
            text,
            re.IGNORECASE
        )

        if date_match:

            data["packed_date"] = (
                date_match.group(1)
            )


        return data