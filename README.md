
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)

## 📌 Project Overview
The Travel Journal is a full-stack, enterprise-grade application deployed entirely on AWS using a **Cost-Optimized 3-Tier Architecture**. The infrastructure is provisioned using **Terraform (IaC)**, allowing the entire cloud environment to be spun up or torn down in minutes. 

This project demonstrates proficiency in cloud networking, high availability, security groups, and automated scaling.

### 🎥 Live Demo & Architecture
> [**[Travel Journal Demo]**](http://travel-journal-prjc.s3-website-us-east-1.amazonaws.com)
> 
> *Note: To optimize cloud costs, the backend compute and database tiers are periodically spun down. When the backend is offline, the React frontend gracefully falls back to a locally-hosted "Portfolio Mode" to maintain a working UI for demonstration purposes.*

<img width="3329" height="2969" alt="Travel Journal - 3 Tier Architecture" src="https://github.com/user-attachments/assets/8e6f8093-2bce-470a-8e87-59ba31b43771" />

---

## 🏗️ Cloud Architecture Highlights

### 1. Network & Security (Tier 1)
* **Custom VPC:** Built a custom Virtual Private Cloud with highly controlled routing.
* **Zero-Trust Security Groups:** Implemented strict firewall rules where the Application Load Balancer (ALB) only accepts traffic from the internet, EC2 instances only accept traffic from the ALB, and the RDS database exclusively accepts connections from the EC2 security group.

### 2. Compute & Scaling (Tier 2)
* **Application Load Balancer (ALB):** Routes internet HTTP traffic across multiple Availability Zones to ensure high availability.
* **Auto Scaling Group (ASG):** Automatically provisions EC2 instances using a custom Launch Template containing a Node.js User Data script. 

### 3. Data Storage (Tier 3)
* **Amazon RDS (MySQL):** A deeply nested relational database isolated from the public internet for secure data storage.

### 4. Cost Optimization (FinOps)
* Engineered a custom routing table to bypass the need for an expensive NAT Gateway ($32/month) by securely deploying compute resources in public subnets while strictly limiting inbound access via Security Groups.

---

## ✨ Application Features
* **Modern UI/UX:** A responsive, vibrant interface built with React and Tailwind CSS.
* **Smart Photo Fallback:** Automatically assigns a high-quality default stock photo via Unsplash API if the user does not provide a custom image URL.
* **Interactive Map Integration:** Visualizes journal entries geographically.
* **Full CRUD Functionality:** Create, Read, Update, and Delete journal entries directly to the AWS RDS database.

---

## 🛠️ Technology Stack
* **Infrastructure as Code:** Terraform
* **Frontend Presentation:** React.js, Tailwind CSS, hosted on Amazon S3 (Static Website Hosting)
* **Backend API:** Node.js, Express.js
* **Database:** Amazon RDS (MySQL)
* **AWS Services:** VPC, EC2, ASG, ALB, Target Groups, Security Groups, S3, IAM

---

## 🚀 How to Deploy (Terraform)

1. Clone this repository to your local machine.
2. Ensure you have AWS CLI configured with appropriate credentials.
3. Navigate to the `terraform` directory:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply --auto-approve
