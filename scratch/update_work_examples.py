import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'api'))

import shared_utils
import time

def update_work_examples():
    db = shared_utils.get_db()
    
    # Fetch existing data
    doc = db["work_examples"].find_one({"_id": "portfolio"})
    if not doc:
        print("Error: No existing portfolio found.")
        return

    categories = doc["categories"]
    
    # Find Local SEO category
    for cat in categories:
        if cat["id"] == "local-seo":
            # Add the new projects to the beginning of the list
            new_projects = [
                { 
                    "name": "Jersey Pickle LLC - Dominance", 
                    "client": "Jersey Pickle LLC", 
                    "result": "+110% Customer Calls", 
                    "detail": "Comprehensive local SEO strategy resulting in 2,598 interactions (+26.7%) and 430 direction requests." 
                },
                { 
                    "name": "APEX Limo - Local Growth", 
                    "client": "APEX limo", 
                    "result": "284 Total Interactions", 
                    "detail": "Strategic Google Business Profile management leading to 215 direction requests and 23 direct calls." 
                }
            ]
            # Merge and limit to 5-7 projects
            cat["examples"] = new_projects + cat["examples"]
            cat["examples"] = cat["examples"][:7] # Keep a few extra but not too many
            break

    db["work_examples"].update_one(
        {"_id": "portfolio"},
        {"$set": {"categories": categories, "updated_at": time.time()}},
        upsert=True
    )
    print("Updated Local SEO work examples with Jersey Pickle and APEX limo.")

if __name__ == "__main__":
    update_work_examples()
