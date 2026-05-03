import re

data = """
Employee ID	Employee Name	Sales Department	Date	Column 1	Column 2	profile name	Amount	Column 3	Percentage	Client Name	Client Name	Email Address	Order Number	Order Link	Instruction Sheet	Remarks	Extend Time	Assign persion	Status	Service Line	Delivered By	Delivered Date	Amount	Deli_Last_Time	Deadline	Op. Department	Platform Status	Order Source	Platform Source	ERP Update
18998	C_Forward_SAA Sales	SAA Team Old	31 March 2026			adsfrenzy_Fiverr	$750.00		$0.20	martinf_17			FO1DC4157E43	https://www.fiverr.com/inbox/martinf_17	https://docs.google.com/spreadsheets/d/10DpyPN49sS8dZt20qVce2RXlaOLIVrrkzUWUWyGx6Wo/edit?usp=sharing	Ajke Delivery Jabe	No Extend	Reza/Robel	Delivered	SEO	Rank_Riser	April 20, 2026	$600.00	22 April 2026 at 12:00:00 AM	Order Done	SAA Team Old	SAA_Old Order	Cross_Sell	Fiverr	YES
... (skipping most lines for brevity in thought, but I'll include them in the file) ...
"""

# Actually I'll just read from the file I created before or use the data again.
# I'll just copy the full script logic here.
import re

full_data = """
Employee ID	Employee Name	Sales Department	Date	Column 1	Column 2	profile name	Amount	Column 3	Percentage	Client Name	Client Name	Email Address	Order Number	Order Link	Instruction Sheet	Remarks	Extend Time	Assign persion	Status	Service Line	Delivered By	Delivered Date	Amount	Deli_Last_Time	Deadline	Op. Department	Platform Status	Order Source	Platform Source	ERP Update
18998	C_Forward_SAA Sales	SAA Team Old	31 March 2026			adsfrenzy_Fiverr	$750.00		$0.20	martinf_17			FO1DC4157E43	https://www.fiverr.com/inbox/martinf_17	https://docs.google.com/spreadsheets/d/10DpyPN49sS8dZt20qVce2RXlaOLIVrrkzUWUWyGx6Wo/edit?usp=sharing	Ajke Delivery Jabe	No Extend	Reza/Robel	Delivered	SEO	Rank_Riser	April 20, 2026	$600.00	22 April 2026 at 12:00:00 AM	Order Done	SAA Team Old	SAA_Old Order	Cross_Sell	Fiverr	YES
"""
# ... I'll include the full data from my memory/previous turns.

lines = """...""".split('\n') # I'll use the lines I parsed in parse_user_data.py
# Actually I'll just run a new one.

# I'll just do a quick count of "SEO" in the user message.
# 60 occurrences of "SEO".
# 11 occurrences of "SMM".

# If I sum the Net for SEO Delivered, I got $27.3k.
# If I add SEO Cancelled Net?
# 3 Cancelled SEO: 200, 320, 176. Total = 696.
# 27.3 + 0.7 = 28k. Still not 30.4k.

# Wait, what if I sum Gross for SEO?
# $33,521.00.

# What if 30.4k is the April Delivered total in the database?
# Let's check the database total for April 2026.
# I ran scripts/check_all_months.py before and it said:
# April 2026: Total Amount: 93321.24, Count: 485

# Wait! 93k is much more than 30k.
# Maybe the user meant for ONE TEAM?
# Let's check team totals for April.
