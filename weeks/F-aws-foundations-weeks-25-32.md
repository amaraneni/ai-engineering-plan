# Section F: AWS foundations with .NET (Weeks 25–32)

You know AWS from the Cloud Practitioner exam. These weeks make it hands-on, in C#. Each week ends with something deployed and then **deleted**, so costs stay low.

**Cost rules for every AWS day:**
- Work in one region, `us-east-1`, so you always know where your resources are.
- Don't assume the Free Tier covers you. Check the price on the service's pricing page before you create something new.
- Tag everything with `project=ai-learning`.
- End each AWS day by deleting what you made, unless the lesson says to keep it. The **Clean up** step tells you how.

**Courses for this section (optional, see [resources.md](../resources.md)):** Udemy's [Ultimate AWS Certified Developer Associate](https://www.udemy.com/course/aws-certified-developer-associate-dva-c01/) (watch only the section for each week's service), [AWS Lambda For The .NET Developer](https://www.udemy.com/course/aws-lambda-dotnet/) for Weeks 27–28, and [AWS CDK v2: Beginner to Advanced](https://www.udemy.com/course/aws-cloud-development-kit-cdk-v2-beginner-to-advanced/) for Week 30. [AWS Skill Builder](https://skillbuilder.aws/) has free courses for every service here.
**roadmap.sh:** [AWS](https://roadmap.sh/aws).

---

## Week 25: A safe AWS setup

**By the end of the week:** an AWS account that's hard to misuse and can't surprise you with a bill, plus a working AWS CLI and .NET SDK.

### Day 1: Secure the root user

**Learn (~20 min)**
- [Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

**Do**
1. Sign in as the root user, and turn on MFA for it (Security credentials, then Multi-factor authentication).
2. Check that the root user has **no** access keys. Delete any that exist.
3. Write down where your root password and MFA device are kept. After today, you won't use root for daily work.

**Done when:** root has MFA and no access keys.

### Day 2: Budgets and cost alerts

**Learn (~15 min)**
- [Managing your costs with AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)

**Do**
1. Create a monthly cost budget of $10, with email alerts at 50%, 80%, and 100% of actual spend, and at 100% of forecast spend.
2. Open Cost Explorer and look at last month's spending by service.
3. Turn on **Free Tier usage alerts** in Billing preferences, if your account offers them.

**Done when:** you've received the confirmation email for your budget alerts.

### Day 3: A daily-use identity with IAM Identity Center

**Learn (~20 min)**
- [Getting started with IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html)

**Do**
1. Enable IAM Identity Center in `us-east-1`.
2. Create a user for yourself, and assign it to your account with the `AdministratorAccess` permission set. This is your learning account, so admin is OK; you'll practice least privilege later.
3. Sign in through the Identity Center portal URL, not as root.

**Done when:** you can open the AWS console through the portal as your new user.

### Day 4: The AWS CLI with SSO

**Learn (~15 min)**
- [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [Configure the CLI with IAM Identity Center](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

**Do**
```powershell
aws configure sso          # profile name: learn, region: us-east-1, output: json
aws sso login --profile learn
aws sts get-caller-identity --profile learn
$env:AWS_PROFILE = "learn"  # use this profile for the rest of the session
```

**Done when:** `get-caller-identity` shows your Identity Center role, and there are no long-lived access keys anywhere on your laptop.

### Day 5: The AWS SDK for .NET

**Learn (~15 min)**
- [AWS SDK for .NET developer guide](https://docs.aws.amazon.com/sdk-for-net/v4/developer-guide/welcome.html)

**Do**
```powershell
dotnet new console -o AwsHello
cd AwsHello
dotnet add package AWSSDK.SecurityToken
dotnet add package AWSSDK.SSO
dotnet add package AWSSDK.SSOOIDC
```
```csharp
using Amazon.SecurityToken;
using Amazon.SecurityToken.Model;

// Credentials come from your AWS_PROFILE (the SSO login), never from code.
var sts = new AmazonSecurityTokenServiceClient();
var me = await sts.GetCallerIdentityAsync(new GetCallerIdentityRequest());
Console.WriteLine($"Account: {me.Account}\nArn: {me.Arn}");
```

**Done when:** your C# app prints your account and role, using the SSO login.

### Day 6: Tagging and finding resources

**Do**
1. Activate the `project` tag as a cost allocation tag in Billing.
2. Run `aws resourcegroupstaggingapi get-resources --tag-filters Key=project,Values=ai-learning`, which should return an empty list for now.
3. Write `ai-learning/aws/cleanup-check.ps1`, which runs that command and lists anything still tagged. Run it at the end of every AWS day from now on.

**Done when:** the script runs and reports zero resources.

### Day 7: Review and catch-up (light)

- Note down your setup in `ai-learning/aws/README.md`: region, profile name, budget, and the cleanup script. Don't write down secrets or account IDs.

---

## Week 26: S3 and IAM roles

**By the end of the week:** you can store and share files in S3 from C#, and you understand IAM policies by writing them.

### Day 1: S3 basics

**Learn (~20 min)**
- [What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

**Do:** in the console, create a bucket named `ai-learning-<your-initials>-<random-number>` in `us-east-1`, with **Block all public access** turned on and the tag `project=ai-learning`. Upload a file, then download it.

**Clean up:** keep the bucket; you'll use it all week. It costs a few cents a month at most for small files.

**Done when:** you can explain buckets, keys, and why public access is blocked by default.

### Day 2: S3 from C#

**Do:** run `dotnet add package AWSSDK.S3`, then write `S3Demo`:
```csharp
using Amazon.S3;
using Amazon.S3.Model;

var s3 = new AmazonS3Client();
string bucket = args[0];

await s3.PutObjectAsync(new PutObjectRequest { BucketName = bucket, Key = "notes/hello.txt", ContentBody = "Hello from C#" });

var list = await s3.ListObjectsV2Async(new ListObjectsV2Request { BucketName = bucket, Prefix = "notes/" });
foreach (var o in list.S3Objects) Console.WriteLine($"{o.Key} {o.Size} bytes");

using var obj = await s3.GetObjectAsync(bucket, "notes/hello.txt");
Console.WriteLine(await new StreamReader(obj.ResponseStream).ReadToEndAsync());
```

**Done when:** it uploads, lists, and reads back your file.

### Day 3: Presigned URLs

**Topic:** a presigned URL gives someone temporary access to one object without making the bucket public.

**Do:** add to `S3Demo`:
```csharp
string url = s3.GetPreSignedURL(new GetPreSignedUrlRequest
{
    BucketName = bucket, Key = "notes/hello.txt", Expires = DateTime.UtcNow.AddMinutes(5), Verb = HttpVerb.GET
});
Console.WriteLine(url);
```
Open the URL in a private browser window. Wait 5 minutes and try again.

**Done when:** the link works, then stops working after it expires.

### Day 4: IAM policies and roles

**Learn (~20 min)**
- [Policies and permissions in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)

**Do**
1. Write a policy that allows only `s3:GetObject` and `s3:ListBucket` on your bucket, and save it as `read-only-bucket.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::YOUR-BUCKET" },
       { "Effect": "Allow", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::YOUR-BUCKET/*" }
     ]
   }
   ```
2. Test it in the [IAM policy simulator](https://policysim.aws.amazon.com/): `GetObject` should be allowed, and `PutObject` and `DeleteObject` denied.

**Done when:** the simulator results match what you expected.

### Day 5: Upload the plan sources to S3

**Do:** add `sources upload --bucket <name>` to the Curriculum Assistant CLI. It uploads `data/sources/*.md` to `sources/` in the bucket, and skips files whose MD5 matches the object's ETag, so unchanged files aren't uploaded again.

**Done when:** running it twice uploads everything the first time and nothing the second time.

### Day 6: Read sources from S3 when indexing

**Do:** add an `ISourceRepository` interface with two implementations, `FileSourceRepository` (the current behavior) and `S3SourceRepository`. Choose one with a setting. Make `index build` work with the S3 version.

**Done when:** you can build the index from S3. Later, the deployed assistant will read its sources this way.

### Day 7: Review and catch-up (light)

- **Clean up:** empty and delete the bucket with `aws s3 rb s3://YOUR-BUCKET --force`, then run your cleanup script.

---

## Week 27: Lambda functions in C#

**By the end of the week:** C# code running on AWS Lambda, with logs, settings, and an IAM role.

### Day 1: What Lambda is

**Learn (~20 min)**
- [Building Lambda functions with C#](https://docs.aws.amazon.com/lambda/latest/dg/lambda-csharp.html)

**Do:** install the tools:
```powershell
dotnet new install Amazon.Lambda.Templates
dotnet tool install -g Amazon.Lambda.Tools
```
Run `dotnet new list lambda` to see the templates.

**Done when:** you can explain cold starts, the handler signature, and how Lambda bills (requests plus duration multiplied by memory).

### Day 2: Your first function

**Do**
```powershell
dotnet new lambda.EmptyFunction -n HelloLambda
cd HelloLambda/src/HelloLambda
```
Open `Function.cs`, and change the handler so it returns `$"Hello {input}, from Lambda in C#"`. Then deploy and invoke it:
```powershell
dotnet lambda deploy-function HelloLambda --function-role hello-lambda-role --region us-east-1
dotnet lambda invoke-function HelloLambda --payload '"Kamal"' --region us-east-1
```
When asked, let the tool create the role with the `AWSLambdaBasicExecutionRole` policy.

**Done when:** the invoke command returns your greeting.

### Day 3: Logs and errors

**Do:** add logging with `context.Logger.LogInformation(...)`, plus a deliberate error when the input is `"fail"`. Invoke it both ways, then open CloudWatch Logs, find the `/aws/lambda/HelloLambda` log group, and read both runs.

**Done when:** you can find a failed run's stack trace in CloudWatch.

### Day 4: Settings and secrets

**Do:** read a setting from an environment variable (`GREETING`), and set it with `dotnet lambda deploy-function ... --environment-variables "GREETING=Hi"`. Then store a fake secret in **Systems Manager Parameter Store** as a `SecureString`, read it with `AWSSDK.SimpleSystemsManagement`, and give the function's role `ssm:GetParameter` permission for that one parameter only.

**Done when:** the function prints the setting and confirms it read the secret (print only its length, never the value).

### Day 5: An S3-triggered function

**Do:** create a function from `lambda.S3` that runs when a `.md` file is uploaded to a bucket. It should log the file name and its word count. Connect the trigger in the console (the function's **Add trigger** button), then upload a file.

**Done when:** uploading a file produces a log line with its word count. This is how real systems process documents as they arrive.

### Day 6: Re-index on upload

**Do:** design (don't build yet) an "index on upload" flow for the Curriculum Assistant. Upload to S3, a Lambda function chunks and embeds the file, and the vectors are written to the store. Write the design in the README, including which embedding model a Lambda function could call (that's Bedrock, in Week 33).

**Done when:** you have a diagram and a list of the IAM permissions the function would need.

### Day 7: Review and catch-up (light)

- **Clean up:** `dotnet lambda delete-function HelloLambda`, delete the S3-trigger function and its bucket, delete the IAM roles you created, and run your cleanup script.

---

## Week 28: An API with API Gateway and Lambda

**By the end of the week:** an ASP.NET Core minimal API running on Lambda behind API Gateway, which is a cheap way to host APIs.

### Day 1: API Gateway basics

**Learn (~20 min)**
- [Choosing between HTTP APIs and REST APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)

**Do:** in your notes, write why an HTTP API is the right default for this project: it's cheaper and simpler.

**Done when:** you can explain routes, integrations, and stages.

### Day 2: ASP.NET Core on Lambda

**Learn (~15 min)**
- [Deploying ASP.NET applications to Lambda](https://docs.aws.amazon.com/lambda/latest/dg/csharp-package-asp.html)

**Do**
```powershell
dotnet new web -o PlanApi
cd PlanApi
dotnet add package Amazon.Lambda.AspNetCoreServer.Hosting
```
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);   // does nothing when run locally

var app = builder.Build();
app.MapGet("/", () => "Plan API is running");
app.MapGet("/weeks/{week:int}", (int week) => week is >= 1 and <= 52
    ? Results.Ok(new { week, title = $"Week {week}" })
    : Results.NotFound());
app.Run();
```
Run it locally with `dotnet run`, and check both endpoints.

**Done when:** it works locally.

### Day 3: Deploy it

**Do:** deploy as a Lambda function with an HTTP API in front:
1. Package it with `dotnet lambda package -o planapi.zip`.
2. In the console, create a function with the .NET 10 runtime and handler `PlanApi` (the assembly name, for executable-style hosting), and upload the zip.
3. Create an HTTP API in API Gateway with a `$default` route pointing at the function.

**Done when:** `Invoke-RestMethod https://<api-id>.execute-api.us-east-1.amazonaws.com/weeks/28` returns JSON.

### Day 4: Real plan data

**Do:** include the plan's `weeks/*.md` files in the package (set them to copy to output), and make `/weeks/{week}` return the real week title and day titles, reusing your Week 2 `GetWeek` parsing code in a shared class.

**Done when:** the deployed API returns real plan content.

### Day 5: Throttling and CORS

**Do**
1. In API Gateway, set the stage's default throttling to 10 requests per second, with a burst of 20.
2. Add a CORS setting that allows only `http://localhost:8080`, your local chat page.
3. Call the API from the browser console on your local chat page.

**Done when:** a browser call from the allowed page works, and you understand why other origins are blocked.

### Day 6: Cost check

**Do:** look up the current prices on the [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/) and [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/) pages, then work out the monthly cost of this API at 10,000 requests per day. Write the calculation in the README.

**Done when:** you have a cost estimate, with the prices you used and the date you checked them.

### Day 7: Review and catch-up (light)

- **Clean up:** delete the HTTP API, the Lambda function, and its role, then run your cleanup script.

---

## Week 29: DynamoDB

**By the end of the week:** your learning progress stored in DynamoDB, with a key design you can explain.

### Day 1: How DynamoDB is different

**Learn (~20 min)**
- [What is Amazon DynamoDB?](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html) and [Best practices for designing partition keys](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html)

**Do:** design a table for progress:
- partition key `PK` = `USER#<id>`
- sort key `SK` = `DAY#W29D1` for a completed day, or `NOTE#<timestamp>` for a note

Write down the three queries you need ("all my completed days", "days in week 29", "my notes") and check that each works with this key design.

**Done when:** every query can be answered with `Query`, without using `Scan`.

### Day 2: Create the table and write items from C#

**Do:** create the table `ai-learning-progress` with **on-demand** capacity and the tag `project=ai-learning`. Then run `dotnet add package AWSSDK.DynamoDBv2` and:
```csharp
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;

[DynamoDBTable("ai-learning-progress")]
public class ProgressItem
{
    [DynamoDBHashKey] public string PK { get; set; } = "";
    [DynamoDBRangeKey] public string SK { get; set; } = "";
    public int Week { get; set; }
    public int Day { get; set; }
    public DateTime CompletedAt { get; set; }
}

var context = new DynamoDBContextBuilder().WithDynamoDBClient(() => new AmazonDynamoDBClient()).Build();
await context.SaveAsync(new ProgressItem { PK = "USER#me", SK = "DAY#W29D2", Week = 29, Day = 2, CompletedAt = DateTime.UtcNow });
```

**Done when:** the item appears in the console's **Explore items** view.

### Day 3: Queries

**Do:** query all completed days, and only week 29, using `begins_with`:
```csharp
var week29 = await context.QueryAsync<ProgressItem>("USER#me", QueryOperator.BeginsWith, ["DAY#W29"]).GetRemainingAsync();
```
Add a test that writes three days and reads back exactly the week 29 ones.

**Done when:** the query returns the right items.

### Day 4: Progress store in the assistant

**Do:** add `DynamoProgressStore : IProgressStore` next to the JSON store from Week 17. Choose between them with a setting. The agent's `GetProgress` and `MarkDayDone` tools work with either.

**Done when:** running the assistant locally with `"Progress": "Dynamo"` records progress in AWS.

### Day 5: Conditional writes

**Topic:** a conditional write only succeeds if a condition is true. It stops two requests from overwriting each other.

**Do:** make `MarkDayDone` fail cleanly if that day is already marked, using a condition that `SK` doesn't exist yet (`attribute_not_exists(SK)`). Return "Already recorded" instead of an error.

**Done when:** marking the same day twice gives "Already recorded".

### Day 6: Least-privilege access

**Do:** write an IAM policy allowing only `dynamodb:GetItem`, `PutItem`, and `Query` on this one table's ARN. Test it in the policy simulator. You'll attach it to the deployed assistant's role in Week 35.

**Done when:** the simulator shows `DeleteTable` and `Scan` are denied.

### Day 7: Review and catch-up (light)

- Keep the table. On-demand costs nothing when idle and pennies for this use. Run your cleanup script, which should list just the table.

---

## Week 30: Infrastructure as code with AWS CDK in C#

**By the end of the week:** you define AWS resources in C# and can create and delete a whole environment with one command each.

### Day 1: What CDK is

**Learn (~20 min)**
- [Working with the AWS CDK in C#](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-csharp.html)

**Do**
```powershell
npm install -g aws-cdk
cdk --version
cdk bootstrap aws://<account-id>/us-east-1 --profile learn
```

**Done when:** bootstrap finishes. It creates a small S3 bucket and roles that CDK uses for deployments.

### Day 2: Your first stack

**Do**
```powershell
mkdir infra; cd infra
cdk init app --language csharp
```
In `src/Infra/InfraStack.cs`:
```csharp
using Amazon.CDK;
using Amazon.CDK.AWS.S3;
using Constructs;

public class InfraStack : Stack
{
    public InfraStack(Construct scope, string id, IStackProps? props = null) : base(scope, id, props)
    {
        Tags.Of(this).Add("project", "ai-learning");

        new Bucket(this, "SourcesBucket", new BucketProps
        {
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = RemovalPolicy.DESTROY,
            AutoDeleteObjects = true    // lets cdk destroy remove a bucket with files in it
        });
    }
}
```
Run `cdk synth` and read the CloudFormation it produces, then `cdk deploy`.

**Done when:** the bucket exists, created from C#.

### Day 3: Lambda and an HTTP API in CDK

**Do:** add your Week 28 `PlanApi` to the stack: a Lambda `Function` with the .NET 10 runtime, its code from `Code.FromAsset("../PlanApi/bin/Release/net10.0/publish")`, and an `HttpApi` (from `Amazon.CDK.AwsApigatewayv2` and `Amazon.CDK.AwsApigatewayv2Integrations`) with a Lambda integration. Output the API URL with `new CfnOutput(...)`.

**Done when:** `cdk deploy` prints the URL, and the API works.

### Day 4: DynamoDB and permissions in CDK

**Do:** define the progress table in CDK, then grant the function access with `table.GrantReadWriteData(function)`. Compare the policy CDK generates (look in the IAM console) with the one you wrote by hand in Week 29.

**Done when:** the function can read and write the table, and you can see that CDK wrote a least-privilege policy for you.

### Day 5: Environments

**Do:** make the stack take an environment name (`dev` or `test`) from CDK context: `cdk deploy -c env=test`. Use it in resource names and tags, so both environments can exist at once.

**Done when:** you can deploy `dev` and `test` side by side, then destroy `test` alone.

### Day 6: The whole thing, up and down

**Do:** time it: `cdk deploy` the full stack from nothing, test the API, then `cdk destroy`. Write down how long each took.

**Done when:** you can create and delete the entire environment with two commands. This is how you'll keep AWS costs low from now on.

### Day 7: Review and catch-up (light)

- Push `infra` to the `CurriculumAssistant` repository. Run `cdk destroy` and then your cleanup script. Keep the CDK bootstrap resources; they cost almost nothing.

---

## Week 31: VPC networking basics

**By the end of the week:** you understand VPCs, subnets, routing, and security groups by building them, and you know which networking parts cost money.

**Cost warning:** a **NAT gateway** costs about a dollar a day even when idle. This week uses **no NAT gateways**. If you'd rather practice in a sandbox, this is the week where paid [AWS Skill Builder labs](https://aws.amazon.com/training/digital/immersive-learning/) are worth it.

### Day 1: The pieces of a VPC

**Learn (~25 min)**
- [How Amazon VPC works](https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html)
- Optional: the VPC section of Udemy's [Ultimate AWS Certified Solutions Architect Associate](https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/)

**Do:** draw a VPC with two Availability Zones, each with a public and a private subnet. Mark the internet gateway, the route tables, and where a NAT gateway would go.

**Done when:** you can explain why a "private" subnet is private: it has no route to the internet gateway.

### Day 2: Build a VPC with CDK

**Do:** in a new CDK stack:
```csharp
var vpc = new Vpc(this, "LearnVpc", new VpcProps
{
    MaxAzs = 2,
    NatGateways = 0,        // no NAT, so no hourly cost
    SubnetConfiguration =
    [
        new SubnetConfiguration { Name = "public", SubnetType = SubnetType.PUBLIC, CidrMask = 24 },
        new SubnetConfiguration { Name = "private", SubnetType = SubnetType.PRIVATE_ISOLATED, CidrMask = 24 }
    ]
});
```
Deploy it, then look at the subnets and route tables in the VPC console.

**Done when:** you can find the route that makes the public subnets public.

### Day 3: Security groups

**Learn (~15 min)**
- [Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)

**Do:** add two security groups. `web` allows HTTPS from anywhere, and `app` allows port 8080 **only from the `web` group**. Check the rules in the console.

**Done when:** you can explain why referencing a security group is better than allowing an IP range.

### Day 4: VPC endpoints

**Topic:** an endpoint lets resources in a private subnet reach AWS services such as S3 without the internet, and without a NAT gateway.

**Do:** add an S3 gateway endpoint to the VPC (`vpc.AddGatewayEndpoint(...)`). Gateway endpoints for S3 and DynamoDB are free. Check the private subnet's route table for the new route.

**Done when:** you can see the endpoint route, and you know which endpoint types have an hourly charge (interface endpoints).

### Day 5: Lambda in a VPC

**Do:** put a small Lambda function in the private subnets with the `app` security group, and have it list your S3 bucket through the endpoint. Then try to fetch `https://example.com` from it, which should time out.

**Done when:** S3 works and the internet doesn't. You've proven the subnet is private.

### Day 6: Troubleshooting drill

**Do:** break it on purpose, one change at a time, and fix it each time:
1. Remove the endpoint route, so S3 times out.
2. Remove the function's S3 permission, so you get access denied.
3. Change the security group to block outbound traffic, so the call times out again.

For each break, write down the exact error and how you'd recognize it next time.

**Done when:** you have a three-row troubleshooting table. Timeouts point to networking, and access denied points to IAM.

### Day 7: Review and catch-up (light)

- **Clean up:** `cdk destroy` the VPC stack, and run your cleanup script.

---

## Week 32: Containers on ECS Fargate

**By the end of the week:** your Curriculum Assistant API's container image in Amazon ECR, running on ECS Fargate behind a load balancer.

**Cost warning:** a load balancer and Fargate tasks cost money every hour they run, roughly a dollar or two a day together. Deploy, test, and destroy on the same day.

### Day 1: Container registry (ECR)

**Learn (~15 min)**
- [What is Amazon ECR?](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)

**Do**
```powershell
aws ecr create-repository --repository-name curriculum-assistant-api --tags Key=project,Value=ai-learning
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag curriculum-assistant-api <account-id>.dkr.ecr.us-east-1.amazonaws.com/curriculum-assistant-api:v1
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/curriculum-assistant-api:v1
```
Use the image you built in Week 14.

**Done when:** the image appears in ECR.

### Day 2: ECS concepts

**Learn (~20 min)**
- [What is Amazon ECS?](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)

**Do:** in your notes, map the ECS terms to Docker Compose: a task definition ≈ a Compose service definition, a task ≈ a running container, and a service ≈ "keep N copies running".

**Done when:** you can explain cluster, task definition, task, and service.

### Day 3: Deploy with CDK

**Do:** in a new stack, use the `ApplicationLoadBalancedFargateService` construct from `Amazon.CDK.AWS.ECS.Patterns`:
- the Week 31 VPC settings (2 AZs, no NAT), with tasks in **public** subnets with `AssignPublicIp = true`, so they can pull the image without a NAT
- your ECR image, 0.5 vCPU, 1 GB of memory, and 1 task
- a health check on `/health`

Ollama and Qdrant aren't on AWS yet, so set an environment variable that makes the API start in a "demo" mode, which answers `/health` and returns a fixed message from `/ask`.

**Done when:** the load balancer URL from `cdk deploy` shows your chat page.

### Day 4: Logs, scaling, and updates

**Do**
1. Find the container logs in CloudWatch.
2. Change the image tag to `v2` with a visible change, push it, and redeploy. Watch ECS replace the task with no downtime.
3. Add auto scaling from 1 to 2 tasks at 60% CPU.

**Done when:** you've done a rolling update and can find its logs.

### Day 5: Secrets for containers

**Do:** put a fake API key in **Secrets Manager**, and pass it to the container as a secret environment variable (`Secret.FromSecretsManager(...)` in the task definition). Show its length in the `/health` output, never the value.

**Done when:** the container reads the secret, and it's not visible in the task definition's plain environment variables.

### Day 6: Fargate or Lambda?

**Do:** write a comparison in the README for this API, covering cost at 100 and at 10,000 requests a day, cold starts, long requests such as streaming answers, and how easy each is to run. Check the current prices on the [Fargate pricing](https://aws.amazon.com/fargate/pricing/) page.

**Done when:** you've made a decision you can defend. You'll use it in Week 35.

### Day 7: Review and catch-up (light)

- **Clean up:** `cdk destroy`, delete the ECR images (or keep them, since storage is cheap), delete the secret, and run your cleanup script.
- Section F is complete. Tick the topics on [roadmap.sh/aws](https://roadmap.sh/aws).
