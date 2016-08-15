if __name__ == '__main__':
    import sys
    import json
    import re
    tab_fname = sys.argv[1]
    COLUMNS = ("Date", "Country", "City", "Killed", "Injured", "Description")
    jsonout_fname = tab_fname + ".json"
    with open(tab_fname, 'r') as tabfile:
        lines = tabfile.read().split('\n')
        rows = []
        for line in sorted(lines):
            columns = line.split('\t')
            columns = tuple([val.strip() for val in columns])
            #print columns
            date, killed, injured, country, location, descr = columns[:6]
            # remove footnote notation (wikipedia)
            descr = re.sub(r'\[\d+\]', '', descr)

            killed, injured = int(killed), int(injured)
            try:
                group = columns[6]
                if group:
                    descr += " (%s)" % group
            except IndexError:
                pass
            print date
            rows.append((date, country, location, killed, injured, descr))


        with open(jsonout_fname, 'w') as outfile:
            outdata = {#'year': year,
                       'columns': COLUMNS,
                       'rows': rows}
            json.dump(outdata, outfile)
        print "Wrote output to:", jsonout_fname