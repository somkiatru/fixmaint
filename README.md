# Zowe-Maintenance-Workshop
Lab demonstrating how Zowe enables engineers to automate the delivery of maintenance to mainframe application using modern build and test frameworks (Gulp and Mocha in this sample). Maintenance PTF is expected to be placed in ./bin.

## Setup
1. Install [Node.js](https://nodejs.org/en/)
2. Install [MS VisualStudio Code](https://code.visualstudio.com/)
3. Install [Zowe CLI](https://zowe.github.io/docs-site/latest/getting-started/cli-getting-started.html#installing)
4. Install Gulp

    `npm install gulp -g`
    
5. Install VSCode extensions: Zowe, ibm-jcl, Gulp Tasks
6. If on Windows 10, open Terminal in VSCode with `View > Terminal` and switch from powershell to cmd
7. Create zosmf zowe profile:

    `zowe profiles create zosmf -h`
    

## Project Setup
1. Copy content of this repo to folder on PC
2. Open terminal within this folder and run:

    `npm install`
    
3. configure `config.json` file
