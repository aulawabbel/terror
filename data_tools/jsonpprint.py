if __name__ == '__main__':
    import sys
    import json
    import os
    outdir = sys.argv[1]
    jsonfnames = sys.argv[2:]
    for jsonfname in jsonfnames:
        print jsonfname
        path, fname = os.path.split(jsonfname)
        outfname = os.path.join(outdir, fname)

        with open(jsonfname,'r') as infile:
            data = json.load(infile)
        with open(outfname,'w') as outfile:
            json.dump(data, outfile, indent=2, sort_keys=True)
        print "Wrote output to:", outfname