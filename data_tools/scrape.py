'''
Scrapes data from  thereligionofpeace.com and writes json files.
'''

from bs4 import BeautifulSoup
import urllib2

COLUMNS = ("Date", "Country", "City", "Killed", "Injured", "Description")

def get_terror(year):
    print "Getting terror for year:", year
    url = "http://www.thereligionofpeace.com/attacks/attacks.aspx?Yr=%d" % (year,)
    html = urllib2.urlopen(url).read()
    print "processing html..."
    soup = BeautifulSoup(html, 'html.parser')
    print "processing table..."
    attack_td = soup.find('td', 'attacks-cell' )
    attack_table = attack_td.parent.parent
    for tr in attack_table.find_all('tr'):
        row = tuple(td.string.strip() for td in tr.find_all('td', 'attacks-cell' ))
        if row:
            assert len(row) == 6, "not correct number of rows: %s" % len(row)
            row = (row[0],row[1],row[2],int(row[3]),int(row[4]),row[5])
            yield row

import json
if __name__ == '__main__':
    import sys
    import os
    import codecs
    try:
        from_year, to_year, outdir = sys.argv[1:]
        from_year = int(from_year)
        to_year = int(to_year)
    except ValueError, e:
        raise SystemExit(__doc__ + 'Syntax: from_year, to_year, outdir\nex.\n 2005 2016 ../data' )
    outdir = os.path.abspath(outdir)
    for year in range(from_year, to_year+1):
        print "Processing:", year
        out_fname = os.path.join(outdir, "terror_%d.txt" % year)
        jsonout_fname = os.path.join(outdir, "terror_%d.json" % year)
        rows = tuple(sorted(get_terror(year)))
        with codecs.open(out_fname, "w", "utf-8") as outfile:
            outfile.write(u"\t".join(COLUMNS) + '\n')
            for row in rows:
                outfile.write(u"\t".join(unicode(val) for val in row))
                outfile.write("\n")
        print "Wrote output to:", out_fname
        with open(jsonout_fname, 'w') as outfile:
            outdata = {'year': year, 
                       'columns': COLUMNS, 
                       'rows': rows}
            json.dump(outdata, outfile)
        print "Wrote output to:", jsonout_fname