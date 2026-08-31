import { Certification, Note, QuestionBank, Question } from '../types';

export const SAMPLE_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-aws-saa',
    name: 'AWS Certified Solutions Architect - Associate',
    code: 'SAA-C03',
    icon: 'Cloud',
    color: '#f59e0b', // Amber
    description: 'Validates ability to design resilient, high-performing, secure, and cost-optimized architectures on AWS.',
    examDurationMinutes: 130,
    accommodationMinutes: 30,
    createdAt: Date.now() - 86400000 * 5,
    lastStudiedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'cert-k8s-cka',
    name: 'Certified Kubernetes Administrator',
    code: 'CKA',
    icon: 'Terminal',
    color: '#3b82f6', // Blue
    description: 'Performance-based certification demonstrating competence in Kubernetes architecture, installation, configuration, and troubleshooting.',
    examDurationMinutes: 120,
    accommodationMinutes: 0,
    createdAt: Date.now() - 86400000 * 10,
    lastStudiedAt: Date.now() - 86400000 * 2,
  },
];

export const SAMPLE_QUESTION_BANKS: QuestionBank[] = [
  {
    id: 'bank-aws-d1',
    certId: 'cert-aws-saa',
    name: 'Domain 1: Design Resilient Architectures',
    description: 'Multi-AZ designs, decoupled architectures using SQS/SNS, Auto Scaling, and disaster recovery.',
    domainTags: ['Resilient Architectures', 'Storage', 'Networking'],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'bank-aws-d2',
    certId: 'cert-aws-saa',
    name: 'Domain 2: Design High-Performing Architectures',
    description: 'Compute performance, caching strategies with CloudFront & ElastiCache, high throughput DBs.',
    domainTags: ['Compute', 'Caching', 'Databases'],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'bank-k8s-cluster',
    certId: 'cert-k8s-cka',
    name: 'Workloads & Scheduling',
    description: 'Pod creation, deployments, daemonsets, node selectors, taints/tolerations, and resource limits.',
    domainTags: ['Workloads', 'Scheduling', 'Troubleshooting'],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 3,
  },
];

export const SAMPLE_QUESTIONS: Question[] = [
  // AWS Multiple Choice
  {
    id: 'q-aws-1',
    certId: 'cert-aws-saa',
    bankId: 'bank-aws-d1',
    type: 'multiple-choice',
    prompt: 'A company runs an e-commerce application on Amazon EC2 instances behind an Application Load Balancer (ALB). During flash sales, traffic spikes exponentially and orders are dropped due to database write saturation. Which architecture provides the MOST decoupled and resilient solution to handle unexpected spikes in order submissions without losing orders?',
    domainTag: 'Resilient Architectures',
    options: [
      { id: 'opt-1', text: 'Upgrade the database instance to the largest memory-optimized Amazon RDS instance with provisioned IOPS.', isCorrect: false },
      { id: 'opt-2', text: 'Place an Amazon SQS FIFO queue between the web tier and an AWS Lambda worker tier to buffer write transactions.', isCorrect: true },
      { id: 'opt-3', text: 'Enable Multi-AZ replication on RDS and configure the web tier to write synchronously to both master and standby.', isCorrect: false },
      { id: 'opt-4', text: 'Deploy an Amazon ElastiCache Redis cluster and write directly to cache without database persistence.', isCorrect: false },
    ],
    explanation: 'Placing an Amazon SQS FIFO queue decouples the front-end submission from the backend ingestion rate, guaranteeing message preservation, ordering, and preventing database overload during sudden traffic spikes.',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'q-aws-2',
    certId: 'cert-aws-saa',
    bankId: 'bank-aws-d1',
    type: 'multiple-choice',
    prompt: 'A media company stores petabytes of video footage in Amazon S3 standard tier. Videos are accessed heavily during the first 30 days after upload, rarely accessed between 30 and 90 days, and must be retained for 7 years for compliance without requiring instant retrieval after 90 days. Which S3 Lifecycle policy minimizes storage costs while meeting compliance requirements?',
    domainTag: 'Storage',
    options: [
      { id: 'opt-21', text: 'Transition to S3 Standard-IA after 30 days, transition to S3 Glacier Flexible Retrieval after 90 days, expire after 2555 days.', isCorrect: true },
      { id: 'opt-22', text: 'Transition directly to S3 Glacier Deep Archive on day 1 with 2555-day retention.', isCorrect: false },
      { id: 'opt-23', text: 'Transition to S3 One Zone-IA after 30 days and delete objects after 90 days.', isCorrect: false },
      { id: 'opt-24', text: 'Keep in S3 Standard with Intelligent-Tiering and enable S3 Object Lock without lifecycle transitions.', isCorrect: false },
    ],
    explanation: 'S3 Standard-IA reduces cost for infrequently accessed data after 30 days. S3 Glacier Flexible Retrieval provides durable low-cost archive after 90 days, and expiration rule handles the 7-year retention policy (2555 days).',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'q-aws-3',
    certId: 'cert-aws-saa',
    bankId: 'bank-aws-d2',
    type: 'multiple-choice',
    prompt: 'A global web service experiences latency for users located in Europe and Asia when retrieving static assets from an Amazon S3 bucket hosted in us-east-1. Which configuration provides the lowest latency and optimal cost efficiency for global asset delivery?',
    domainTag: 'Caching',
    options: [
      { id: 'opt-31', text: 'Create an Amazon CloudFront distribution with the S3 bucket configured as the origin and an Origin Access Control (OAC).', isCorrect: true },
      { id: 'opt-32', text: 'Enable S3 Cross-Region Replication to 15 different AWS regions worldwide.', isCorrect: false },
      { id: 'opt-33', text: 'Configure Amazon Route 53 Geolocation routing to redirect traffic to local EC2 web servers.', isCorrect: false },
      { id: 'opt-34', text: 'Deploy an AWS Global Accelerator in front of the S3 bucket endpoints directly.', isCorrect: false },
    ],
    explanation: 'Amazon CloudFront caches static objects at edge locations worldwide, drastically decreasing latency for global users and reducing data transfer out costs from Amazon S3.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  // Kubernetes Scenario Question
  {
    id: 'q-k8s-1',
    certId: 'cert-k8s-cka',
    bankId: 'bank-k8s-cluster',
    type: 'scenario',
    prompt: 'You are troubleshooting a pod named "payment-processor" in the "finance" namespace. The pod remains in a Pending state. Inspect the pod spec YAML and node taint details below, and identify what is preventing the pod from being scheduled on worker-node-02.',
    domainTag: 'Scheduling',
    scenarioDetails: {
      scenarioType: 'yaml',
      context: 'Node "worker-node-02" has taint: dedicated=finance:NoSchedule\nPod specification is provided below:',
      codeSnippet: `apiVersion: v1
kind: Pod
metadata:
  name: payment-processor
  namespace: finance
spec:
  containers:
  - name: processor
    image: redis:7-alpine
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "billing"
    effect: "NoSchedule"`,
    },
    options: [
      { id: 'opt-k1', text: 'The pod toleration value is "billing" instead of matching the node taint value "finance".', isCorrect: true },
      { id: 'opt-k2', text: 'The toleration operator must be "Exists" instead of "Equal" when a value is provided.', isCorrect: false },
      { id: 'opt-k3', text: 'The namespace "finance" requires an explicit NetworkPolicy before scheduling.', isCorrect: false },
      { id: 'opt-k4', text: 'The effect must be "NoExecute" rather than "NoSchedule".', isCorrect: false },
    ],
    explanation: 'Worker node worker-node-02 is tainted with dedicated=finance:NoSchedule. The pod only tolerates dedicated=billing:NoSchedule. To schedule on this node, the toleration value must match "finance" or use operator: Exists.',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  // Kubernetes Command Recall Flashcard
  {
    id: 'q-k8s-2',
    certId: 'cert-k8s-cka',
    bankId: 'bank-k8s-cluster',
    type: 'flashcard',
    prompt: 'Which imperative kubectl command drains "node-1" for maintenance, safely evicting pods while ignoring DaemonSets and forcing removal of unmanaged local data pods?',
    domainTag: 'Troubleshooting',
    flashcard: {
      frontPrompt: 'What imperative kubectl command drains "node-1" for maintenance, safely ignoring DaemonSets and deleting emptyDir data?',
      backAnswer: 'kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data --force',
      commandSnippet: 'kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data --force',
    },
    explanation: '--ignore-daemonsets prevents the drain command from failing on daemonset pods, and --delete-emptydir-data permits eviction even if pods use local emptyDir storage.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

export const SAMPLE_NOTES: Note[] = [
  {
    id: 'note-aws-1',
    certId: 'cert-aws-saa',
    title: 'VPC Architecture & CIDR Cheat Sheet',
    content: `# AWS Virtual Private Cloud (VPC) Core Concepts

## 1. CIDR Block Sizing
- Allowed block sizes: **/16** (65,536 IPs) to **/28** (16 IPs).
- In any AWS subnet, **5 IP addresses are reserved**:
  - \`.0\`: Network address
  - \`.1\`: VPC router
  - \`.2\`: DNS (AmazonProvidedDNS)
  - \`.3\`: Future use
  - \`.255\`: Broadcast address

## 2. Public vs Private Subnets
> **Rule of thumb**: A public subnet contains a route entry to an **Internet Gateway (IGW)** in its route table (\`0.0.0.0/0 -> igw-xxxx\`). A private subnet routes outbound traffic through a **NAT Gateway** located in a public subnet.

## 3. High Availability Checklist
- [x] Deploy subnets across at least 2 Availability Zones (AZs)
- [x] Place separate NAT Gateways in each AZ for fault tolerance
- [x] Use Network Access Control Lists (NACLs) as stateless subnet firewalls
- [x] Use Security Groups as stateful instance-level firewalls`,
    tags: ['VPC', 'Networking', 'CIDR', 'Security'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'note-k8s-1',
    certId: 'cert-k8s-cka',
    title: 'CKA Speed Commands & Alias Configurations',
    content: `# CKA Exam Speed Optimization

## Quick Bash Profile Setup
\`\`\`bash
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
\`\`\`

## Imperative Generators
- **Create Pod**: \`k run nginx --image=nginx $do > pod.yaml\`
- **Create Deployment**: \`k create deploy web --image=nginx --replicas=3 $do > deploy.yaml\`
- **Expose Service**: \`k expose deploy web --port=80 --target-port=8080 --type=NodePort\`

## Fast Troubleshoot
- Check logs: \`k logs <pod> --previous\`
- Events sorted: \`k get events --sort-by='.metadata.creationTimestamp'\``,
    tags: ['CLI', 'Speed', 'Kubectl', 'Tips'],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 2,
  },
];
