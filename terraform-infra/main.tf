# ==============================================================================
# TRAVEL JOURNAL - INFRASTRUCTURE AS CODE (TERRAFORM)
# Phase 1: The Networking Foundation
# ==============================================================================

# 1. Define the Cloud Provider (AWS)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Update this to your preferred region (e.g., us-west-2)
}

# Add a variable for the database password so it isn't hardcoded in the repo
variable "db_password" {
  description = "The master password for the RDS database"
  type        = string
  sensitive   = true
}

# 2. Create the Virtual Private Cloud (VPC)
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "Travel-Journal-VPC"
    Environment = "Production"
  }
}

# 3. Create the Internet Gateway (Allows internet access to the VPC)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = {
    Name = "Travel-Journal-IGW"
  }
}

# 4. Create Two Public Subnets (For High Availability across 2 AZs)
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a" # Ensure this matches your region
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b" # Ensure this matches your region
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-2"
  }
}

# 5. Create a Route Table and associate it with the Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "Travel-Journal-Public-RT"
  }
}

resource "aws_route_table_association" "public_rt_assoc_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rt_assoc_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# ==============================================================================
# Phase 2: Security Groups & Private Database Subnets
# ==============================================================================

# 6. Create Two Private Subnets (For the RDS Database)
resource "aws_subnet" "private_db_subnet_1" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a" # Must match your public subnet AZs

  tags = {
    Name = "Travel-Journal-Private-DB-1"
  }
}

resource "aws_subnet" "private_db_subnet_2" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b" # Must match your public subnet AZs

  tags = {
    Name = "Travel-Journal-Private-DB-2"
  }
}

# 7. Create Security Groups (Zero-Trust Model)

# ALB Security Group (Internet facing)
resource "aws_security_group" "alb_sg" {
  name        = "travel-journal-alb-sg"
  description = "Allow HTTP inbound traffic from the internet"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Application Security Group
resource "aws_security_group" "app_sg" {
  name        = "travel-journal-app-sg"
  description = "Allow traffic from ALB only"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # Explicitly trusting the ALB
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Database Security Group
resource "aws_security_group" "db_sg" {
  name        = "travel-journal-db-sg"
  description = "Allow MySQL traffic from App instances only"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "MySQL from App SG"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id] # Explicitly trusting the EC2 servers
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==============================================================================
# Phase 3: The Data Tier (Amazon RDS)
# ==============================================================================

# 8. Create a DB Subnet Group (Tells RDS which subnets it can use)
resource "aws_db_subnet_group" "travel_journal_db_subnet_group" {
  name       = "travel-journal-db-subnet-group"
  subnet_ids = [aws_subnet.private_db_subnet_1.id, aws_subnet.private_db_subnet_2.id]

  tags = {
    Name = "Travel Journal DB Subnet Group"
  }
}

# 9. Provision the MySQL RDS Instance
resource "aws_db_instance" "travel_journal_db" {
  identifier             = "travel-journal-db"
  allocated_storage      = 20
  max_allocated_storage  = 100 # Enables storage auto-scaling
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro" # Free Tier eligible (usually)
  db_name                = "travel_journal_db" # The initial database created
  username               = "admin" # Master username
  password               = var.db_password # Pulls from variable instead of plain text
  
  db_subnet_group_name   = aws_db_subnet_group.travel_journal_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  
  skip_final_snapshot    = true # Set to true for dev/portfolio. False for real production.
  publicly_accessible    = false # ZERO TRUST: The internet cannot reach this DB.

  tags = {
    Name = "Travel-Journal-MySQL-DB"
  }
}

# Output the Database Endpoint (You will need this for your Node.js backend!)
output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.travel_journal_db.endpoint
}
# TRAVEL JOURNAL - INFRASTRUCTURE AS CODE (TERRAFORM)
# Phase 1: The Networking Foundation
# ==============================================================================

# 1. Define the Cloud Provider (AWS)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Update this to your preferred region (e.g., us-west-2)
}

# 2. Create the Virtual Private Cloud (VPC)
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "Travel-Journal-VPC"
    Environment = "Production"
  }
}

# 3. Create the Internet Gateway (Allows internet access to the VPC)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = {
    Name = "Travel-Journal-IGW"
  }
}

# 4. Create Two Public Subnets (For High Availability across 2 AZs)
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a" # Ensure this matches your region
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b" # Ensure this matches your region
  map_public_ip_on_launch = true

  tags = {
    Name = "Travel-Journal-Public-Subnet-2"
  }
}

# 5. Create a Route Table and associate it with the Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "Travel-Journal-Public-RT"
  }
}

resource "aws_route_table_association" "public_rt_assoc_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rt_assoc_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# ==============================================================================
# Phase 2: Security Groups & Private Database Subnets
# ==============================================================================

# 6. Create Two Private Subnets (For the RDS Database)
resource "aws_subnet" "private_db_subnet_1" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a" # Must match your public subnet AZs

  tags = {
    Name = "Travel-Journal-Private-DB-1"
  }
}

resource "aws_subnet" "private_db_subnet_2" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b" # Must match your public subnet AZs

  tags = {
    Name = "Travel-Journal-Private-DB-2"
  }
}

# 7. Create Security Groups (Zero-Trust Model)

# ALB Security Group (Internet facing)
resource "aws_security_group" "alb_sg" {
  name        = "travel-journal-alb-sg"
  description = "Allow HTTP inbound traffic from the internet"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Application Security Group
resource "aws_security_group" "app_sg" {
  name        = "travel-journal-app-sg"
  description = "Allow traffic from ALB only"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # Explicitly trusting the ALB
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Database Security Group
resource "aws_security_group" "db_sg" {
  name        = "travel-journal-db-sg"
  description = "Allow MySQL traffic from App instances only"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "MySQL from App SG"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id] # Explicitly trusting the EC2 servers
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==============================================================================
# Phase 3: The Data Tier (Amazon RDS)
# ==============================================================================

# 8. Create a DB Subnet Group (Tells RDS which subnets it can use)
resource "aws_db_subnet_group" "travel_journal_db_subnet_group" {
  name       = "travel-journal-db-subnet-group"
  subnet_ids = [aws_subnet.private_db_subnet_1.id, aws_subnet.private_db_subnet_2.id]

  tags = {
    Name = "Travel Journal DB Subnet Group"
  }
}

# 9. Provision the MySQL RDS Instance
resource "aws_db_instance" "travel_journal_db" {
  identifier             = "travel-journal-db"
  allocated_storage      = 20
  max_allocated_storage  = 100 # Enables storage auto-scaling
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro" # Free Tier eligible (usually)
  db_name                = "travel_journal_db" # The initial database created
  username               = "admin" # Master username
  password               = "TravelJournal2026!" # Master password (In production, use Secrets Manager!)
  
  db_subnet_group_name   = aws_db_subnet_group.travel_journal_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  
  skip_final_snapshot    = true # Set to true for dev/portfolio. False for real production.
  publicly_accessible    = false # ZERO TRUST: The internet cannot reach this DB.

  tags = {
    Name = "Travel-Journal-MySQL-DB"
  }
}

# Output the Database Endpoint (You will need this for your Node.js backend!)
output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.travel_journal_db.endpoint
}
