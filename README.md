# Introduction
This Vsts extension simplify the process of running terraform commands during your build process. It's written in Node.js, so that it runs quicker than Powershell, and independently of the build agent Os.

This extension is still at preview state. Comments are welcome.

# Screenshot
![screenshot](https://raw.githubusercontent.com/arkiaconsulting/vsts-terraform/master/screenshot.png)

# Getting Started
### Mandatory
In the "Main" pane, select plan or apply.
### Options
1. Choose wether or not to download terraform (specifying the version)
2. Configure your AzureRM provider
2. Run "init"
3. Choose the "workspace"
4. Save a terraform output variable to a vsts variable

# Extra Links
[Hashicorp terraforms](https://www.terraform.io/)