# Discordian
GPT-2 Discord simulator using threads or individuals

## Setup
### Prerequisites
It's possible to train / simulate using CPU instead of GPU, but I highly recommend using a GPU.
1. Anaconda
2. Updated NVIDIA GPU Drivers
3. Node / NPM
### Restore network environment using CONDA
```
cd network
conda env create
```
### Verify all devices are found as expected
```
cd network
conda activate discordian-network
python verify.py
```
You should see a printout of all available devices, if you're wanting to use GPU acceleration you should verify you have a GPU listed here. If not verify that the environment creation completed correctly and that you're running the latest NVIDIA drivers.
### Restore discord interface using NPM
```
cd app
npm install
```
### Configure
Copy `data/config.example.json` => `data/config.json` and add relevant configuration.
## Running
### Dump messages
```
cd app
npm run dump
```
### Train network
The amount of training required to produce interesting results varies depending on the size of the input (from what I've seen anyway). There is a "target loss" target that we try to reach of 0.2, this works well for single user training but breaks down with thread training, I've seen most of the time a loss target of around 1 does pretty well for threads. It depends, I encourage you to try it at different points to see what the output looks like. You can always continue to train it more.
```
cd network
python train.py --entry=threads
```
### Simulate
```
cd app
npm run simulate
```