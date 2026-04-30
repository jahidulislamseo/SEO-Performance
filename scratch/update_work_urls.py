import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'api'))

import shared_utils
import time

def update_work_examples_with_urls():
    db = shared_utils.get_db()
    
    doc = db["work_examples"].find_one({"_id": "portfolio"})
    if not doc:
        print("Error: No existing portfolio found.")
        return

    categories = doc["categories"]
    
    for cat in categories:
        if cat["id"] == "local-seo":
            for proj in cat["examples"]:
                if "Jersey Pickle" in proj["name"]:
                    proj["url"] = "https://docs.google.com/presentation/d/1vS5GYD4K85pIdgpD03qGOIAJ-Rl30Q69NWg5oApIrC4/edit?slide=id.g3b893032d9a_4_26#slide=id.g3b893032d9a_4_26"
                elif "APEX limo" in proj["name"]:
                    proj["url"] = "https://docs.google.com/presentation/d/1js9KJ1QcYBwHb0Yk5X0mV7d2_RgGhxQUsfY1Pk72wi8/edit?slide=id.g3b893032d9a_4_491#slide=id.g3b893032d9a_4_491"
            break

    db["work_examples"].update_one(
        {"_id": "portfolio"},
        {"$set": {"categories": categories, "updated_at": time.time()}},
        upsert=True
    )
    print("Updated Local SEO projects with Case Study URLs.")

if __name__ == "__main__":
    update_work_examples_with_urls()
