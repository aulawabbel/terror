'''
Small interactive console util to ease cleanup of json data based on text filtering.
'''

import re
re_filter = re.compile(r'(suspected|honor)', re.IGNORECASE)
DESC_COL = 5

def save_json(outfname, data):
    with open(outfname,'w') as outfile:
        json.dump(data, outfile, indent=2, sort_keys=True)

if __name__ == '__main__':
    import sys
    import json
    import os
    jsonfnames = sys.argv[1:]
    for jsonfname in jsonfnames:
        print jsonfname
        path, fname = os.path.split(jsonfname)
        outfname = jsonfname + ".cleaned.json"

        with open(jsonfname,'r') as infile:
            data = json.load(infile)

        out_rows = []
        rows = data['rows']
        data['rows'] = out_rows
        for row in rows:
            if re_filter.match(row[DESC_COL]):
                print ' | '.join(str(val) for val in row)
                print re_filter.sub(r'** \1 **', row[DESC_COL])
                while True:
                    answer = raw_input('Remove [Y/N]: ').upper()
                    if answer not in ('Y', 'N'):
                        print "Please press Y or N"
                        continue
                    else:
                        break
                if (answer == 'Y'):
                    continue
            out_rows.append(row)

        save_json(outfname, data)
        print "Wrote output to:", outfname
