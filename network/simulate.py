"""This module simulates the given entry."""

import argparse
import gpt_2_simple as gpt2
from common import load_config, load_metadata, data_dir

def main():
    """ Main function """
    parser = argparse.ArgumentParser(description='Simulate an entry.')
    parser.add_argument('--entry', dest="entry", required=True)
    parser.add_argument('--sample-size', dest="sample_size", default=20)
    parser.add_argument('--batch-size', dest="batch_size", default=10)
    args = parser.parse_args()

    # Arguments
    entry = str(args.entry)
    sample_size = int(args.sample_size)
    batch_size = int(args.batch_size)

    # Metadata / config
    metadata = load_metadata()
    config = load_config()

    ## Read relevant info from config

    if entry not in metadata:
        raise Exception("Entry not in metadata: " + entry)

    entry_dict = metadata[entry]
    sample_delim = entry_dict.get('delimitter', None)
    prefix = entry_dict.get('prefix', None)
    postfix = entry_dict.get('postfix', None)

    output_filename = data_dir + entry + "_sample.txt"

    results = []

    sess = gpt2.start_tf_sess()

    gpt2.load_gpt2(sess, run_name=entry)

    results = gpt2.generate(sess,
                            run_name=entry,
                            nsamples=sample_size,
                            batch_size=batch_size,
                            prefix=prefix,
                            truncate=postfix,
                            sample_delim=sample_delim,
                            return_as_list=True,
                            include_prefix=False)

    # Trim results
    results = list(map(lambda result: result.strip(), results))
    # Remove any empty
    results = list(filter(lambda result: result, results))
    # Remove duplicates
    results = list(set(results))
    results = results[:sample_size]

    # Write to file
    out = open(output_filename, 'w', encoding='utf-8')
    for result in results:
        out.write("{}{}\n".format(result, sample_delim))
    out.close()

if __name__ == "__main__":
    main()
