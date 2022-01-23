"""This module trains entries."""

import os
import argparse
import gpt_2_simple as gpt2
from common import load_config, load_metadata, data_dir

def main():
    """ Main function """
    parser = argparse.ArgumentParser(description='Train a entry.')
    parser.add_argument('--entry', dest="entry", required=True)
    args = parser.parse_args()

    # Arguments
    entry_id = str(args.entry)

    # Metadata / config
    metadata = load_metadata()
    config = load_config()

    ## Read relevant info from config
    model_name = config['training']['model']
    max_steps = config['training']['maxSteps']

    sess = gpt2.start_tf_sess()

    def train_entry(sess, entry_id):
        if entry_id not in metadata:
            raise Exception("Entry not in metadata: " + entry_id)

        entry = metadata[entry_id]
        name = entry["name"]

        print(f"\n=======Starting training for {entry_id} ({name})\n")

        input_filename = data_dir + entry_id + "_messages.txt"

        gpt2.finetune(sess,
                      sample_size=1024,
                      dataset=input_filename,
                      model_name=model_name,
                      run_name=entry_id,
                      save_every=100,
                      sample_every=max_steps + 1,
                      sample_num=0,
                      steps=max_steps)   # steps is max number of training steps

        sess = gpt2.reset_session(sess)

        return sess

    # Download the model if it doesn't exist
    if not os.path.isdir(os.path.join("models", model_name)):
        print(f"Downloading {model_name} model...")
        gpt2.download_gpt2(model_name=model_name)

    # Train specific entry
    sess = train_entry(sess, entry_id)

if __name__ == "__main__":
    main()
