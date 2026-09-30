import { Certification, Note, QuestionBank, Question } from '../types';
import { generateStephaneMaarekMockSet } from './mockQuestionBankGenerator';

export const SAMPLE_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-aws-saa',
    name: 'AWS Certified Solutions Architect – Associate',
    code: 'SAA-C03',
    icon: 'Cloud',
    color: '#f59e0b', // Amber
    description: 'Valida a capacidade de projetar arquiteturas seguras, resilientes, de alto desempenho e otimizadas em custos na AWS.',
    examDurationMinutes: 130,
    accommodationMinutes: 30,
    domains: [
      {
        name: 'Domain 1: Design Secure Architectures',
        order: 1,
        description: 'Design secure access to AWS resources, secure workloads, and data encryption controls (30%).',
      },
      {
        name: 'Domain 2: Design Resilient Architectures',
        order: 2,
        description: 'Design scalable, decoupled, multi-AZ, and disaster-tolerant architectures (26%).',
      },
      {
        name: 'Domain 3: Design High-Performing Architectures',
        order: 3,
        description: 'Design high-performing compute, storage, networking, and database solutions (24%).',
      },
      {
        name: 'Domain 4: Design Cost-Optimized Architectures',
        order: 4,
        description: 'Design cost-effective storage, compute, database, and network architectures (20%).',
      },
    ],
    createdAt: Date.now() - 86400000 * 10,
    lastStudiedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'cert-k8s-cka',
    name: 'Certified Kubernetes Administrator',
    code: 'CKA',
    icon: 'Terminal',
    color: '#3b82f6', // Blue
    description: 'Certificação prática baseada em desempenho avaliando administração, instalação, rede e troubleshooting de clusters Kubernetes.',
    examDurationMinutes: 120,
    accommodationMinutes: 0,
    domains: [
      { name: 'Storage', order: 1, description: 'StorageClasses, PersistentVolumes, VolumeAccessModes (10%).' },
      { name: 'Troubleshooting', order: 2, description: 'Cluster nodes, core components, worker nodes, and pods (30%).' },
      { name: 'Workloads & Scheduling', order: 3, description: 'Deployments, DaemonSets, rolling updates, taints/tolerations (15%).' },
      { name: 'Cluster Architecture, Installation & Config', order: 4, description: 'Kubeadm, etcd backup/restore, RBAC (25%).' },
      { name: 'Services & Networking', order: 5, description: 'ClusterIP, Ingress, NetworkPolicies, CoreDNS (20%).' },
    ],
    createdAt: Date.now() - 86400000 * 12,
    lastStudiedAt: Date.now() - 86400000 * 2,
  },
];

const stephaneMock = generateStephaneMaarekMockSet('cert-aws-saa', SAMPLE_CERTIFICATIONS[0].domains);

export const SAMPLE_QUESTION_BANKS: QuestionBank[] = [
  // --- AWS SAA-C03 Banks: 4 Simulados de 75 questões do Stephane Maarek ---
  ...stephaneMock.banks,

  // Outros professores para demonstrar agrupamento e filtros
  {
    id: 'bank-aws-td',
    certId: 'cert-aws-saa',
    name: 'Simulado 1 · Tutorials Dojo / Jon Bonso',
    authorOrVendor: 'Tutorials Dojo (Jon Bonso)',
    description: 'Simulado de alta dificuldade no estilo clássico da Tutorials Dojo com cenários de pegadinhas, VPC Peering, Direct Connect e Disaster Recovery.',
    domainTags: SAMPLE_CERTIFICATIONS[0].domains?.map((d) => d.name) || [],
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
  },

  // --- CKA Banks ---
  {
    id: 'bank-k8s-sim1',
    certId: 'cert-k8s-cka',
    name: 'Simulado 1 · Mumshad Mannambeth (KodeKloud)',
    authorOrVendor: 'KodeKloud',
    description: 'Simulado completo cobrindo cenários imperativos de kubeadm, RBAC, troubleshooting de control plane e NetworkPolicies.',
    domainTags: [
      'Storage',
      'Troubleshooting',
      'Workloads & Scheduling',
      'Cluster Architecture, Installation & Config',
      'Services & Networking',
    ],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'bank-k8s-sim2',
    certId: 'cert-k8s-cka',
    name: 'Simulado 2 · Killer.sh (Exame Avançado)',
    authorOrVendor: 'Killer.sh',
    description: 'Simulado de alta pressão e dificuldade avançada idêntico ao ambiente do exame oficial CKA da Linux Foundation.',
    domainTags: [
      'Storage',
      'Troubleshooting',
      'Workloads & Scheduling',
      'Cluster Architecture, Installation & Config',
      'Services & Networking',
    ],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

export const SAMPLE_QUESTIONS: Question[] = [
  // 300 questões (4 simulados x 75 questões) distribuídas pelos 4 domínios oficiais da AWS SAA-C03
  ...stephaneMock.questions,

  // ====================================================
  // SIMULADO 1 & 2 · KUBERNETES CKA
  // ====================================================
  {
    id: 'q-k8s-s1-1',
    certId: 'cert-k8s-cka',
    bankId: 'bank-k8s-sim1',
    type: 'scenario',
    domainTag: 'Workloads & Scheduling',
    prompt: 'Você precisa implantar um Pod de monitoramento no namespace "monitoring" que deve executar em um nó de infraestrutura rotulado com "node-role=infra". Inspecione a especificação YAML abaixo e indique o campo necessário para garantir que o pod seja agendado exclusivamente nesse nó:',
    scenarioDetails: {
      scenarioType: 'yaml',
      context: 'Nó worker possui a label "node-role=infra".',
      codeSnippet: `apiVersion: v1
kind: Pod
metadata:
  name: cluster-agent
  namespace: monitoring
spec:
  containers:
  - name: agent
    image: prometheus/node-exporter:v1.7.0
  nodeSelector:
    node-role: infra`,
    },
    options: [
      { id: 'opt-k1-1', text: 'O campo nodeSelector com a chave "node-role: infra" seleciona nós que possuem exatamente essa label correspondente.', isCorrect: true },
      { id: 'opt-k1-2', text: 'O campo affinity com anti-affinity obrigatório em relação a pods de aplicação.', isCorrect: false },
      { id: 'opt-k1-3', text: 'É obrigatório declarar um DaemonSet para agendar pods em nós específicos.', isCorrect: false },
      { id: 'opt-k1-4', text: 'O agendador ignora nodeSelector caso o nó possua taints sem tolerations correspondentes.', isCorrect: false },
    ],
    explanation: 'O nodeSelector é a forma mais simples e direta de agendamento condicional baseado em labels de nós no Kubernetes.',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'q-k8s-s1-2',
    certId: 'cert-k8s-cka',
    bankId: 'bank-k8s-sim1',
    type: 'flashcard',
    domainTag: 'Cluster Architecture, Installation & Config',
    prompt: 'Qual comando etcdctl realiza o backup snapshot do banco de dados do etcd em um cluster Kubernetes com TLS habilitado?',
    flashcard: {
      frontPrompt: 'Qual comando etcdctl tira um snapshot consistente do etcd salvando em /opt/backup/etcd-snapshot.db?',
      backAnswer: 'ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /opt/backup/etcd-snapshot.db',
      commandSnippet: 'ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /opt/backup/etcd-snapshot.db',
    },
    explanation: 'No exame CKA, salvar e restaurar snapshots do etcd é uma das questões práticas mais comuns. O parâmetro snapshot save cria o arquivo pontual do estado do cluster.',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'q-k8s-s2-1',
    certId: 'cert-k8s-cka',
    bankId: 'bank-k8s-sim2',
    type: 'scenario',
    domainTag: 'Troubleshooting',
    prompt: 'Um nó worker-02 entrou em estado "NotReady". Ao inspecionar os logs do sistema operacional com journalctl, você nota erros recorrentes de conexão do kubelet com a porta 6443 do kube-apiserver. Qual das opções a seguir é a causa MAIS provável e ação de resolução?',
    options: [
      { id: 'opt-k2-1', text: 'O certificado do kubelet expirou ou o arquivo de configuração /etc/kubernetes/kubelet.conf aponta para o endereço IP incorreto do Control Plane.', isCorrect: true },
      { id: 'opt-k2-2', text: 'O CoreDNS do cluster parou de funcionar e impediu o agendamento de novos pods.', isCorrect: false },
      { id: 'opt-k2-3', text: 'O nó worker atingiu o limite de PersistentVolumes permitidos.', isCorrect: false },
      { id: 'opt-k2-4', text: 'O kube-proxy foi desinstalado acidentalmente.', isCorrect: false },
    ],
    explanation: 'Quando um nó fica NotReady por falha de comunicação entre kubelet e API Server, as causas primárias são certificados de cliente expirados em /var/lib/kubelet/pki ou configuração incorreta do servidor no kubelet.conf.',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
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
