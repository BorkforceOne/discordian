import json

data_dir = "../data/"
metadata_path = data_dir + "metadata.json"
config_path = data_dir + "config.json"

def load_metadata():
    with open(metadata_path, mode="r", encoding='utf-8') as metadata_file:
        return json.loads(metadata_file.read())

def save_metadata(metadata):
    with open(metadata_path, mode="w", encoding='utf-8') as metadata_file:
        json.dump(metadata, metadata_file, indent=2, sort_keys=True)

def load_config():
    with open(config_path, mode="r", encoding='utf-8') as config_file:
        return json.loads(config_file.read())
