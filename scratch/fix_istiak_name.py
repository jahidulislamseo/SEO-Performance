
import os, sys
sys.path.append(os.getcwd())
from shared_utils import get_db
db = get_db()
db['members'].update_one({'name': 'Istiak ishq'}, {'$set': {'name': 'Istiak Ishq'}})
print("Fixed Istiak Ishq name successfully")
