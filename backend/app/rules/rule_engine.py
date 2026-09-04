import json


class RuleEngine:

    def __init__(self):

        with open(
            "app/rules/packaged_rules.json",
            "r"
        ) as file:

            data = json.load(file)

        self.rules = data["rules"]


    def evaluate(self, product):

        violations = []

        score = 100


        for rule in self.rules:

            field = rule["field"]

            value = product.get(field)


            if rule["required"] and not value:

                violations.append({

                    "rule_id":
                        rule["id"],

                    "rule_name":
                        rule["name"],

                    "severity":
                        rule["severity"],

                    "message":
                        f"{rule['name']} is missing"

                })

                score -= rule["points"]


        score = max(score, 0)


        status = "COMPLIANT"

        if violations:

            status = "NON_COMPLIANT"


        return {

            "score":
                score,

            "status":
                status,

            "violations":
                violations

        }