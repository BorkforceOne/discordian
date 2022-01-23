import os
from tensorflow.python.client import device_lib
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

## Prints out the avaliable devices to verify that everything is setup correctly

print("List of devices avaliable for GPT-2:")
local_devices = device_lib.list_local_devices()
for local_device in local_devices:
    print(f'{local_device.name} ({local_device.device_type}) : {local_device.physical_device_desc}')
