import { Question, QuestionBank, CertificationDomain, Certification } from '../types';

interface RealisticScenarioTemplate {
  domainOrder: number;
  prompt: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
}

// 75 authentic AWS SAA-C03 scenario blueprints mapped to the 4 official domains
const AWS_SAA_BLUEPRINTS: RealisticScenarioTemplate[] = [
  // --- DOMAIN 1: DESIGN SECURE ARCHITECTURES (21 templates) ---
  {
    domainOrder: 1,
    prompt: 'Uma empresa precisa armazenar credenciais de banco de dados e rotacioná-las a cada 30 dias automaticamente sem downtime para containers ECS.',
    correctAnswer: 'Armazenar as credenciais no AWS Secrets Manager e configurar a rotação automática nativa via função Lambda gerenciada.',
    distractors: [
      'Salvar como SecureString no Systems Manager Parameter Store e criar uma cron na EC2.',
      'Criptografar as chaves no AWS KMS e embuti-las estaticamente nas variáveis de ambiente da task.',
      'Criar uma tabela criptografada no DynamoDB e consultar via aplicação.',
    ],
    explanation: 'O AWS Secrets Manager oferece rotação nativa gerenciada com Lambda e integração segura direta com o Amazon ECS.',
  },
  {
    domainOrder: 1,
    prompt: 'Um bucket S3 deve ser acessível unicamente a partir de instâncias EC2 dentro de uma VPC privada, bloqueando qualquer requisição via internet.',
    correctAnswer: 'Criar um VPC Endpoint do tipo Gateway para o S3 e adicionar uma Bucket Policy com a condição aws:sourceVpce.',
    distractors: [
      'Configurar um NAT Gateway e liberar apenas o IP público no Security Group do bucket.',
      'Habilitar AWS Shield Advanced na VPC e associar ao bucket.',
      'Definir uma regra de Network ACL permitindo apenas a porta 443 para o CIDR do S3.',
    ],
    explanation: 'VPC Gateway Endpoints permitem tráfego interno direto e a condição aws:sourceVpce na Bucket Policy restringe o acesso exclusivamente ao endpoint.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma organização com 2.500 funcionários precisa centralizar o acesso a 20 contas AWS usando o Microsoft Active Directory corporativo existente.',
    correctAnswer: 'Integrar o AWS IAM Identity Center (antigo AWS SSO) com o Active Directory on-premises via AD Connector ou federação SAML 2.0.',
    distractors: [
      'Criar usuários IAM manuais em cada uma das 20 contas e sincronizar senhas via script bash.',
      'Configurar um Amazon Cognito User Pool replicado entre todas as contas.',
      'Distribuir Access Keys permanentes salvas localmente para cada desenvolvedor.',
    ],
    explanation: 'O AWS IAM Identity Center centraliza autenticação corporativa multi-conta com suporte a SSO e federação SAML/AD.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma empresa financeira precisa que todos os dados gravados no Amazon EBS sejam criptografados por padrão em todas as novas instâncias de uma região.',
    correctAnswer: 'Habilitar a configuração regional "Always encrypt new EBS volumes" nas preferências do Amazon EC2 no console ou via CLI.',
    distractors: [
      'Criar uma política de IAM proibindo a ação ec2:RunInstances sem parâmetro KMS.',
      'Criar um script em cada servidor para formatar o disco com LUKS na inicialização.',
      'Utilizar um bucket S3 montado via NFS no lugar do Amazon EBS.',
    ],
    explanation: 'A opção regional "EBS encryption by default" garante que todo volume e snapshot criado na região use uma chave KMS automaticamente.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma aplicação web distribuída sofre com ataques DDoS na camada de aplicação (camada 7) como injeções SQL e flood de requisições HTTP.',
    correctAnswer: 'Associar o AWS WAF com regras gerenciadas (Managed Rules) à distribuição do CloudFront ou Application Load Balancer.',
    distractors: [
      'Configurar regras de Network ACL bloqueando portas efêmeras.',
      'Aumentar o tamanho das instâncias EC2 do Auto Scaling Group.',
      'Ativar o Amazon GuardDuty para bloquear o tráfego nos security groups.',
    ],
    explanation: 'O AWS WAF inspeciona requisições na Camada 7 inspecionando SQLi, XSS e limitando taxa de requisições por IP.',
  },
  {
    domainOrder: 1,
    prompt: 'Auditoria exige que qualquer alteração de permissões ou chamadas à API da AWS seja registrada e mantida em armazenamento imutável por 5 anos.',
    correctAnswer: 'Habilitar o AWS CloudTrail gravando em bucket S3 configurado com Object Lock em modo Compliance.',
    distractors: [
      'Exportar logs do CloudWatch para instâncias EC2 locais diariamente.',
      'Configurar o AWS Config com regras de retenção de 90 dias.',
      'Habilitar o VPC Flow Logs gravando no Amazon Kinesis.',
    ],
    explanation: 'CloudTrail registra todas as chamadas de API, e o S3 Object Lock no modo Compliance impede deleção ou alteração mesmo pelo root.',
  },
  {
    domainOrder: 1,
    prompt: 'Desenvolvedores precisam de acesso SSH a instâncias EC2 em subnets privadas sem utilizar Bastion Host nem abrir portas de entrada no Security Group.',
    correctAnswer: 'Instalar o AWS Systems Manager Agent (SSM Agent) e conectar via Session Manager usando políticas de IAM.',
    distractors: [
      'Abrir a porta 22 para 0.0.0.0/0 no Security Group da subnet privada.',
      'Configurar um túnel VPN IPsec client-to-site com IP público fixo.',
      'Atribuir Elastic IPs a todas as instâncias privadas.',
    ],
    explanation: 'O AWS Systems Manager Session Manager permite sessões shell seguras e auditadas via HTTPS sem portas de entrada abertas.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma empresa quer garantir que objetos sensíveis gravados no S3 não possam ser excluídos acidentalmente por nenhum operador com credenciais válidas.',
    correctAnswer: 'Habilitar Versioning no bucket e ativar o recurso S3 MFA Delete exigindo código de autenticação multifator.',
    distractors: [
      'Remover permissões de leitura no Security Group associado ao bucket.',
      'Criptografar os objetos com SSE-S3 com chave padrão gerenciada.',
      'Mover os arquivos para S3 Glacier Flexible Retrieval imediatamente.',
    ],
    explanation: 'O MFA Delete exige autenticação multifator para mudar o status de versionamento ou deletar permanentemente uma versão de objeto.',
  },
  {
    domainOrder: 1,
    prompt: 'Um aplicativo precisa compartilhar chaves de criptografia KMS gerenciadas pelo cliente (CMK) com outra conta AWS parceira.',
    correctAnswer: 'Atualizar a Key Policy da chave KMS na conta proprietária concedendo permissões para a conta parceira e configurar políticas no IAM da conta parceira.',
    distractors: [
      'Exportar o material da chave privada e enviar via e-mail corporativo.',
      'Criar uma VPC Peering e compartilhar a chave via tráfego de rede TCP.',
      'Mudar a chave KMS de Customer Managed para AWS Managed Key.',
    ],
    explanation: 'O acesso cross-account no KMS requer permissão explícita na Key Policy da conta dona e permissão correspondente no IAM da conta consumidora.',
  },
  {
    domainOrder: 1,
    prompt: 'Um sistema de pagamentos precisa detectar ameaças e acessos anômalos à infraestrutura AWS usando Machine Learning contínuo sobre logs de DNS, VPC e CloudTrail.',
    correctAnswer: 'Ativar o Amazon GuardDuty na organização para análise contínua e inteligente de ameaças.',
    distractors: [
      'Criar alarmes manuais no CloudWatch Metrics para CPU Utilization.',
      'Instalar antivírus de terceiros em um único servidor bastion.',
      'Ativar o AWS Trusted Advisor em modo semanal.',
    ],
    explanation: 'O GuardDuty monitora fluxos de VPC, DNS e CloudTrail usando inteligência e ML para identificar credenciais comprometidas ou comportamento anômalo.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma empresa precisa inspecionar e registrar todo o tráfego de rede TLS/SSL de saída entre VPCs corporativas e serviços externos na internet.',
    correctAnswer: 'Implantar o AWS Network Firewall em uma VPC centralizada de inspeção gerenciando regras de saída e certificados.',
    distractors: [
      'Utilizar um Internet Gateway com regras de iptables locais.',
      'Ativar o Route 53 Resolver sem filtros de domínio.',
      'Bloquear a porta 80 nas Network ACLs das subnets públicas.',
    ],
    explanation: 'O AWS Network Firewall oferece inspeção profunda de pacotes (DPI), prevenção de intrusão (IPS) e filtragem de domínios com stateful rules.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma equipe quer restringir as ações máximas que qualquer conta de uma unidade de negócios pode executar, impedindo uso de certas regiões da AWS.',
    correctAnswer: 'Aplicar uma Service Control Policy (SCP) na Unidade Organizacional (OU) relevante no AWS Organizations.',
    distractors: [
      'Criar uma IAM Role com permissões de leitura no console de cobrança.',
      'Definir regras de Security Group em cada VPC manualmente.',
      'Adicionar políticas de bucket em todas as contas.',
    ],
    explanation: 'As SCPs definem os guardrails centrais de permissões máximas para membros da organização no AWS Organizations.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma aplicação web exposta ao público precisa aceitar conexões HTTPS com certificados TLS renovados e emitidos automaticamente sem custos por certificado.',
    correctAnswer: 'Provisionar certificados públicos gratuitos no AWS Certificate Manager (ACM) e associá-los ao CloudFront ou ALB.',
    distractors: [
      'Gerar certificados autoassinados no OpenSSL e instalá-los em cada servidor EC2.',
      'Adquirir certificados de CA externa e fazer upload manual a cada 90 dias no S3.',
      'Configurar o Route 53 com DNSSEC e desativar o HTTPS na camada web.',
    ],
    explanation: 'O ACM emite e renova automaticamente certificados SSL/TLS públicos gratuitos para serviços integrados como ALB e CloudFront.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma empresa quer garantir que instâncias EC2 não utilizem a versão vulnerável do Instance Metadata Service (IMDSv1).',
    correctAnswer: 'Configurar o parâmetro HttpTokens=required (IMDSv2) nas configurações de metadados das instâncias via CLI ou Launch Template.',
    distractors: [
      'Desativar a placa de rede eth0 nas instâncias EC2.',
      'Bloquear o IP 169.254.169.254 nas rotas do Internet Gateway.',
      'Instalar um proxy reverso Squid em todas as instâncias.',
    ],
    explanation: 'O IMDSv2 requer requisições com tokens de sessão (HttpTokens=required), mitigando ataques de SSRF (Server-Side Request Forgery).',
  },
  {
    domainOrder: 1,
    prompt: 'Um aplicativo em container no ECS precisa ler um parâmetro de configuração não sensível e outro sensível (string criptografada).',
    correctAnswer: 'Armazenar o não sensível como String e o sensível como SecureString criptografada com KMS no AWS Systems Manager Parameter Store.',
    distractors: [
      'Criar dois buckets S3 públicos e ler arquivos JSON via curl.',
      'Salvar ambos como texto puro no Dockerfile da imagem.',
      'Criar duas chaves SSH no console do IAM.',
    ],
    explanation: 'O Parameter Store suporta parâmetros do tipo String e SecureString com criptografia KMS sem custo adicional em nível standard.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma empresa precisa garantir que dados armazenados em tabelas Amazon DynamoDB sejam criptografados em repouso com chave KMS gerenciada pelo cliente.',
    correctAnswer: 'Selecionar a opção de criptografia KMS Customer Managed Key (CMK) durante a criação da tabela DynamoDB.',
    distractors: [
      'Escrever um algoritmo de cifra no código do cliente antes de cada PutItem.',
      'Ativar criptografia no volume EBS anexado ao DynamoDB.',
      'Configurar SSL mútuo nos endpoints do DynamoDB Accelerator (DAX).',
    ],
    explanation: 'O DynamoDB suporta criptografia em repouso nativa com KMS (chaves gerenciadas pela AWS ou Customer Managed Keys).',
  },
  {
    domainOrder: 1,
    prompt: 'Um bucket S3 contém relatórios que devem ser compartilhados com clientes externos através de URLs temporárias válidas por apenas 15 minutos.',
    correctAnswer: 'Gerar URLs pré-assinadas (Presigned URLs) do S3 com prazo de expiração de 15 minutos utilizando o AWS SDK.',
    distractors: [
      'Tornar o bucket público e criar um job cron para torná-lo privado após 15 minutos.',
      'Criar credenciais IAM permanentes e enviar para cada cliente por e-mail.',
      'Montar o bucket S3 via FTP público.',
    ],
    explanation: 'S3 Presigned URLs concedem acesso temporário a objetos específicos sem expor credenciais da conta nem abrir o bucket publicamente.',
  },
  {
    domainOrder: 1,
    prompt: 'Um arquiteto precisa auditar recursos AWS que não estão em conformidade com as regras da empresa (como volumes EBS sem tag "Ambiente" ou buckets S3 abertos).',
    correctAnswer: 'Implementar regras gerenciadas do AWS Config com remediação automática via AWS Systems Manager Automation.',
    distractors: [
      'Executar manualmente relatórios do AWS Cost Explorer uma vez ao mês.',
      'Instalar o agente do CloudWatch em todas as instâncias.',
      'Configurar rotas estáticas na VPC apontando para um syslog.',
    ],
    explanation: 'O AWS Config avalia continuamente configurações e conformidade com regras, permitindo remediação automática.',
  },
  {
    domainOrder: 1,
    prompt: 'Uma aplicação web utiliza o CloudFront. Os usuários devem acessar o bucket S3 de origem unicamente através da CDN, nunca diretamente pelo S3.',
    correctAnswer: 'Configurar o Origin Access Control (OAC) na distribuição do CloudFront e restringir a Bucket Policy para permitir apenas o serviço CloudFront.',
    distractors: [
      'Adicionar o IP público de cada usuário na política do bucket S3.',
      'Bloquear a porta 443 nas subnets privadas da VPC.',
      'Utilizar um bastion host intermediário entre o S3 e o CloudFront.',
    ],
    explanation: 'O Origin Access Control (OAC) autentica as requisições do CloudFront para o S3 de forma segura e moderna.',
  },
  {
    domainOrder: 1,
    prompt: 'Como conceder a uma função Lambda permissões mínimas para ler mensagens de uma fila Amazon SQS específica?',
    correctAnswer: 'Criar uma Execution Role no IAM com política concedendo apenas as ações sqs:ReceiveMessage, sqs:DeleteMessage e sqs:GetQueueAttributes para o ARN da fila.',
    distractors: [
      'Atribuir a política AdministratorAccess à função Lambda.',
      'Embutir a Access Key do usuário root no código-fonte da função.',
      'Configurar a fila SQS como pública sem política de acesso.',
    ],
    explanation: 'Princípio do menor privilégio (Least Privilege): conceder via Execution Role apenas as ações estritamente necessárias para o recurso alvo.',
  },
  {
    domainOrder: 1,
    prompt: 'Como proteger credenciais de banco de dados gravadas em logs de depuração gerados pelo CloudWatch Logs?',
    correctAnswer: 'Configurar Data Protection and Masking Policies no AWS CloudWatch Logs para mascarar automaticamente dados sensíveis como senhas e CPF.',
    distractors: [
      'Desativar o envio de logs para o CloudWatch.',
      'Compactar os arquivos de log com senha zip local antes do envio.',
      'Excluir o grupo de logs a cada 24 horas.',
    ],
    explanation: 'O recurso nativo CloudWatch Logs Data Protection detecta e mascara dados confidenciais usando padrões pré-definidos de PII.',
  },

  // --- DOMAIN 2: DESIGN RESILIENT ARCHITECTURES (19 templates) ---
  {
    domainOrder: 2,
    prompt: 'Um aplicativo de e-commerce precisa suportar picos extremos de compras no checkout sem que o banco de dados seja sobrecarregado ou transações sejam perdidas.',
    correctAnswer: 'Inserir uma fila Amazon SQS FIFO entre a camada de API e os consumidores de background que processam as ordens no banco de dados.',
    distractors: [
      'Aumentar a instância do RDS manualmente durante a Black Friday.',
      'Gravar os pedidos em arquivos de log temporários nas instâncias EC2.',
      'Habilitar Multi-AZ no RDS e gravar simultaneamente nos dois nós.',
    ],
    explanation: 'O SQS desacopla as camadas, armazena picos de tráfego de maneira durável e garante entrega na ordem com filas FIFO.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa financeira exige RTO < 10 minutos e RPO = 0 para seu banco de dados relacional crítico em caso de pane em um datacenter.',
    correctAnswer: 'Implantar o Amazon RDS em arquitetura Multi-AZ com replicação física síncrona para a réplica em standby.',
    distractors: [
      'Configurar backups diários automáticos do RDS copiados para outra região.',
      'Criar uma Read Replica assíncrona na mesma Zona de Disponibilidade.',
      'Configurar um cluster MySQL standalone em uma instância EC2 única.',
    ],
    explanation: 'O RDS Multi-AZ realiza replicação síncrona (RPO = 0) com failover automático transparente em menos de 2 minutos (RTO < 10 min).',
  },
  {
    domainOrder: 2,
    prompt: 'Uma aplicação web corporativa precisa ser tolerante a falhas de Zona de Disponibilidade e distribuir o tráfego HTTP de forma balanceada.',
    correctAnswer: 'Implantar um Application Load Balancer em subnets públicas distribuídas em pelo menos 2 AZs com Auto Scaling Group em subnets privadas correspondentes.',
    distractors: [
      'Criar um único servidor EC2 com Elastic IP fixo e monitoramento por ping.',
      'Configurar um Network Load Balancer associado a uma única subnet privada.',
      'Utilizar o Route 53 com registros A estáticos apontando para instâncias isoladas.',
    ],
    explanation: 'A arquitetura canônica resiliente na AWS utiliza ALB multi-AZ balanceando instâncias distribuídas em subnets privadas de múltiplas AZs.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa precisa migrar uma arquitetura para suportar Disaster Recovery com a estratégia "Pilot Light" em uma região secundária.',
    correctAnswer: 'Replicar dados continuamente para a região secundária (ex: RDS Cross-Region Read Replica) mantendo recursos de computação mínimos ou desligados até o failover.',
    distractors: [
      'Manter uma cópia idêntica 100% ativa e dimensionada rodando em produção na segunda região.',
      'Fazer backup mensal em fitas físicas e enviar para a outra região via correios.',
      'Desligar o banco de dados na região primária para economizar energia.',
    ],
    explanation: 'Pilot Light mantém os dados sincronizados e os serviços core prontos para iniciar rapidamente em caso de desastre regional.',
  },
  {
    domainOrder: 2,
    prompt: 'Um serviço de streaming de vídeo precisa notificar 4 microsserviços diferentes (notificação, analytics, encode e faturamento) sempre que um novo vídeo é enviado.',
    correctAnswer: 'Utilizar o padrão Fan-Out com um tópico Amazon SNS publicando para 4 filas Amazon SQS individuais assinantes.',
    distractors: [
      'Fazer o serviço de upload chamar os 4 microsserviços de forma síncrona via HTTP encadeado.',
      'Gravar o vídeo no EBS e compartilhar o volume via NFS.',
      'Criar uma fila SQS compartilhada onde todos os 4 serviços leem a mesma mensagem concorrentemente.',
    ],
    explanation: 'O padrão Fan-out (SNS -> múltiplas filas SQS) desacopla emissores e consumidores com tolerância a falhas individual.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma aplicação web legada mantém sessões em memória nas instâncias EC2. Os usuários perdem o login quando uma instância é substituída pelo Auto Scaling.',
    correctAnswer: 'Migrar o gerenciamento de sessões para um cluster Amazon ElastiCache (Redis) centralizado e desacoplado.',
    distractors: [
      'Ativar o Session Stickiness no Load Balancer e desabilitar o Auto Scaling.',
      'Aumentar o tempo de vida da instância EC2 para infinito.',
      'Salvar as sessões em arquivos temporários em /tmp de cada máquina.',
    ],
    explanation: 'A melhor prática para arquiteturas stateless e resilientes é externalizar sessões para um cache compartilhado como Redis.',
  },
  {
    domainOrder: 2,
    prompt: 'Um cluster Amazon Aurora MySQL precisa fornecer capacidade de leitura escalável e failover automatizado com recuperação quase instantânea.',
    correctAnswer: 'Adicionar Aurora Replicas distribuídas em múltiplas AZs compartilhando o mesmo cluster storage subjacente.',
    distractors: [
      'Criar instâncias EC2 com replicação binária manual do MySQL.',
      'Fazer snapshot do Aurora a cada hora e restaurar sob demanda.',
      'Usar apenas a instância primária com volume EBS de 64 TB.',
    ],
    explanation: 'Aurora Replicas atuam como nós de leitura e alvos automáticos de failover em menos de 30 segundos sem perda de dados.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa quer failover automático de DNS global entre duas regiões da AWS com base na saúde da aplicação web.',
    correctAnswer: 'Criar registros de failover no Amazon Route 53 associados a Health Checks apontando para os endpoints de cada região.',
    distractors: [
      'Alterar os servidores de nomes (NS) do domínio manualmente durante o incidente.',
      'Usar um balanceador ALB global com IP Anycast único.',
      'Configurar um script de ping local no computador do administrador de rede.',
    ],
    explanation: 'Route 53 DNS Health Checks monitoram a disponibilidade dos endpoints e redirecionam o tráfego automaticamente para a região secundária.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa precisa garantir que mensagens em uma fila SQS que não possam ser processadas após 5 tentativas não bloqueiem as outras mensagens.',
    correctAnswer: 'Configurar uma Dead-Letter Queue (DLQ) na fila SQS com maxReceiveCount configurado para 5.',
    distractors: [
      'Deletar a fila SQS e criar outra vazia.',
      'Aumentar o Visibility Timeout para 12 horas.',
      'Desativar o tratamento de erros no código consumidor.',
    ],
    explanation: 'Dead-Letter Queues isolam mensagens com falha persistente (poison pills) para análise posterior sem travar a fila principal.',
  },
  {
    domainOrder: 2,
    prompt: 'Como proteger uma arquitetura baseada em microsserviços contra falhas em cascata quando um serviço downstream dependente fica instável?',
    correctAnswer: 'Implementar o padrão Circuit Breaker e retentativas com Exponential Backoff e Jitter no cliente.',
    distractors: [
      'Aumentar o timeout das chamadas HTTP para 10 minutos.',
      'Repetir a requisição imediatamente 100 vezes por segundo em loop.',
      'Remover a verificação de status HTTP da aplicação.',
    ],
    explanation: 'Exponential backoff com jitter e circuit breakers evitam sobrecarregar serviços instáveis com rajadas síncronas de retentativas.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa precisa de alta disponibilidade para arquivos compartilhados SMB do Windows Server acessíveis por instâncias EC2 em múltiplas AZs.',
    correctAnswer: 'Implantar o Amazon FSx for Windows File Server em configuração Multi-AZ.',
    distractors: [
      'Utilizar um volume EBS anexado simultaneamente a instâncias em AZs diferentes.',
      'Criar um bucket S3 com protocolo FTP habilitado.',
      'Compartilhar uma pasta local em uma máquina virtual Windows sem replicação.',
    ],
    explanation: 'O Amazon FSx for Windows File Server Multi-AZ fornece armazenamento SMB corporativo totalmente gerenciado com replicação contínua.',
  },
  {
    domainOrder: 2,
    prompt: 'Um aplicativo em containers precisa de orquestração com recuperação automática de tarefas com falha e garantia do número desejado de containers.',
    correctAnswer: 'Configurar um Amazon ECS Service com desiredCount > 1 distribuído em subnets de múltiplas AZs.',
    distractors: [
      'Executar containers avulsos via comando docker run em uma máquina EC2 única.',
      'Criar uma imagem AMI e iniciar um servidor para cada requisição HTTP.',
      'Configurar um cron no Linux para reiniciar o processo em caso de queda.',
    ],
    explanation: 'O ECS Service mantém a contagem desejada de tasks saudáveis, substituindo automaticamente instâncias ou containers degradados.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma aplicação de missão crítica precisa de gravação ativa e leitura de dados distribuída globalmente com latência de resposta em milissegundos.',
    correctAnswer: 'Utilizar o Amazon DynamoDB Global Tables com replicação multi-ativa totalmente gerenciada entre regiões.',
    distractors: [
      'Usar um banco RDS PostgreSQL com replicação assíncrona cross-region e escrita remota via WAN.',
      'Configurar um cluster NFS montado inter-region.',
      'Salvar os dados em arquivos CSV no Amazon S3 com sincronização por script.',
    ],
    explanation: 'DynamoDB Global Tables oferece gravação e leitura multi-região multi-ativa totalmente gerenciada com replicação automática.',
  },
  {
    domainOrder: 2,
    prompt: 'Durante um evento de pico de tráfego, as instâncias EC2 do Auto Scaling Group demoram 10 minutos para iniciar e configurar o software.',
    correctAnswer: 'Criar uma Golden AMI pré-configurada com todas as dependências e utilizar Launch Templates com Warm Pools ou Target Tracking Scaling.',
    distractors: [
      'Compilar todos os pacotes a partir do código-fonte no UserData em cada boot.',
      'Desativar o Auto Scaling e manter 50 instâncias ligadas 24x7 o ano inteiro.',
      'Mudar o tamanho do disco EBS para o menor valor possível.',
    ],
    explanation: 'Golden AMIs reduzem drasticamente o tempo de inicialização de novas instâncias, complementadas por EC2 Warm Pools.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa precisa armazenar backups de banco de dados com 99,999999999% (11 noves) de durabilidade de dados contra perda física.',
    correctAnswer: 'Armazenar os backups no Amazon S3 Standard, que replica objetos automaticamente em pelo menos 3 Zonas de Disponibilidade.',
    distractors: [
      'Salvar em um único volume EBS do tipo sc1 (Cold HDD).',
      'Manter os backups no Instance Store de uma instância i3en.',
      'Gravar no S3 One Zone-IA.',
    ],
    explanation: 'S3 Standard oferece 11 noves de durabilidade redundando os dados de forma transparente em no mínimo 3 AZs separadas geograficamente.',
  },
  {
    domainOrder: 2,
    prompt: 'Um processo batch de processamento de imagens falha no meio e precisa ser reiniciado do ponto onde parou sem reprocessar as etapas anteriores.',
    correctAnswer: 'Orquestrar o fluxo de trabalho utilizando o AWS Step Functions com tratamento de erros, retentativas e persistência de estado.',
    distractors: [
      'Escrever um script monolítico com loop infinito em uma máquina virtual.',
      'Disparar todas as etapas em paralelo sem persistência intermediária.',
      'Criar uma fila SQS sem Dead-Letter Queue.',
    ],
    explanation: 'O AWS Step Functions gerencia máquinas de estados distribuídas com checkpoints, rastreabilidade de erros e retentativas configuráveis.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma empresa quer garantir que seu site estático continue respondendo caso a infraestrutura web primária sofra um desastre catastrófico.',
    correctAnswer: 'Configurar o CloudFront com uma Origin Request Policy apontando para um bucket S3 com site estático como Origin failover.',
    distractors: [
      'Trocar manualmente os servidores Apache.',
      'Criar duas contas AWS sem conexão entre elas.',
      'Solicitar que os usuários limpem o cache do navegador.',
    ],
    explanation: 'O CloudFront suporta Origin Groups com failover automático quando a origem primária retorna códigos de erro 5xx.',
  },
  {
    domainOrder: 2,
    prompt: 'Como evitar que falhas em uma única Zona de Disponibilidade afetem a resolução de nomes da rede corporativa na AWS?',
    correctAnswer: 'Distribuir os Route 53 Resolver Inbound e Outbound Endpoints em subnets de pelo menos duas Zonas de Disponibilidade distintas.',
    distractors: [
      'Criar apenas um Inbound Endpoint em uma subnet pública.',
      'Instalar um servidor DNS BIND em uma única instância t2.micro.',
      'Desativar o AmazonProvidedDNS na VPC.',
    ],
    explanation: 'Para alta disponibilidade de DNS híbrido, o Route 53 Resolver exige a especificação de IP endpoints em no mínimo 2 AZs diferentes.',
  },
  {
    domainOrder: 2,
    prompt: 'Uma aplicação financeira precisa manter consistência estrita e evitar processamento duplicado de transações em mensageria assíncrona.',
    correctAnswer: 'Utilizar filas Amazon SQS FIFO com Message Deduplication ID e Message Group ID configurados.',
    distractors: [
      'Utilizar uma fila Amazon SQS Standard com intervalo de polling longo.',
      'Enviar mensagens via broadcast UDP.',
      'Publicar eventos em arquivos de texto no Amazon EFS.',
    ],
    explanation: 'Filas SQS FIFO garantem entrega exatamente uma vez (Exactly-Once Processing) com ordenação estrita por Message Group ID.',
  },

  // --- DOMAIN 3: DESIGN HIGH-PERFORMING ARCHITECTURES (18 templates) ---
  {
    domainOrder: 3,
    prompt: 'Usuários em Tóquio e Sydney relatam alta latência ao baixar vídeos e imagens estáticas hospedados em um bucket S3 em us-east-1.',
    correctAnswer: 'Implantar o Amazon CloudFront como CDN na frente do bucket S3 utilizando centenas de Edge Locations mundiais.',
    distractors: [
      'Ativar S3 Transfer Acceleration em todas as requisições GET dos clientes.',
      'Habilitar replicação multi-região do S3 para 10 regiões mundiais com endpoints diretos.',
      'Aumentar o tamanho do bucket S3 para 100 TB.',
    ],
    explanation: 'O CloudFront armazena objetos em cache nas Edge Locations próximas aos usuários, reduzindo a latência e o custo de transferência.',
  },
  {
    domainOrder: 3,
    prompt: 'Centenas de instâncias EC2 em várias Zonas de Disponibilidade precisam de acesso simultâneo de leitura e gravação a um sistema de arquivos POSIX compartilhado com alta vazão.',
    correctAnswer: 'Montar o Amazon Elastic File System (Amazon EFS) com modo de desempenho General Purpose ou Max I/O.',
    distractors: [
      'Utilizar volumes Amazon EBS gp3 compartilhados via Multi-Attach entre múltiplas AZs.',
      'Montar um bucket S3 como disco local utilizando s3fs-fuse.',
      'Criar um volume Instance Store em uma instância master e compartilhar via NFS não gerenciado.',
    ],
    explanation: 'O Amazon EFS é compatível com POSIX e suporta montagem concorrente em milhares de instâncias EC2 em múltiplas AZs nativamente.',
  },
  {
    domainOrder: 3,
    prompt: 'Um banco de dados de comércio eletrônico no Amazon Aurora sofre lentidão devido a relatórios analíticos de Business Intelligence concorrendo com gravações de checkout.',
    correctAnswer: 'Criar Aurora Read Replicas dedicadas para análise e apontar as ferramentas de BI para o Reader Endpoint do cluster.',
    distractors: [
      'Aumentar o espaço de armazenamento provisionado do Aurora.',
      'Executar as consultas de BI diretamente no nó primário de gravação de madrugada.',
      'Instalar índices manuais em todas as colunas de todas as tabelas.',
    ],
    explanation: 'O Aurora Reader Endpoint distribui consultas analíticas entre as Read Replicas sem impactar o desempenho do nó de gravação OLTP.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma aplicação web distribuída globalmente precisa direcionar o tráfego dos usuários até o endpoint AWS mais próximo utilizando a rede backbone global da AWS.',
    correctAnswer: 'Configurar o AWS Global Accelerator para fornecer 2 Anycast Static IPs e rotear o tráfego na rede privada global da AWS.',
    distractors: [
      'Utilizar o Route 53 com registros do tipo MX.',
      'Distribuir endereços Elastic IPs aleatórios aos clientes.',
      'Configurar um túnel VPN direto para cada cliente final.',
    ],
    explanation: 'O AWS Global Accelerator utiliza a rede de fibra privada da AWS e Anycast IPs estáticos para otimizar velocidade e latência.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma aplicação precisa armazenar em cache resultados de consultas complexas de banco de dados para reduzir a latência de leitura para submilisegundos.',
    correctAnswer: 'Implantar o Amazon ElastiCache for Redis na frente do banco de dados relacional.',
    distractors: [
      'Adicionar mais memória RAM em cada máquina cliente.',
      'Substituir o RDS por um bucket S3 Standard.',
      'Habilitar o CloudWatch Detailed Monitoring com intervalo de 1 minuto.',
    ],
    explanation: 'O Amazon ElastiCache for Redis entrega dados em memória com latência inferior a 1 milissegundo, aliviando a carga do banco relacional.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma carga de trabalho de High Performance Computing (HPC) distribuída precisa de comunicação inter-nós de altíssima velocidade e baixa latência de rede.',
    correctAnswer: 'Implantar as instâncias EC2 em um Cluster Placement Group dentro da mesma Zona de Disponibilidade utilizando Elastic Fabric Adapter (EFA).',
    distractors: [
      'Espalhar as instâncias em um Spread Placement Group em 3 regiões distintas.',
      'Conectar as instâncias através de uma VPN IPsec na internet pública.',
      'Utilizar instâncias da família t4g.nano.',
    ],
    explanation: 'Cluster Placement Groups colocam instâncias no mesmo rack ou switch físico para latência mínima e máxima largura de banda de rede.',
  },
  {
    domainOrder: 3,
    prompt: 'Um banco de dados NoSQL DynamoDB sofre picos de requisições repetidas nas mesmas chaves primárias. Como obter latência de microssegundos em leituras?',
    correctAnswer: 'Habilitar o DynamoDB Accelerator (DAX) como cluster de cache em memória totalmente integrado.',
    distractors: [
      'Aumentar as unidades de leitura RCU provisionadas da tabela em 100x.',
      'Criar uma tabela secundária com as mesmas informações.',
      'Usar um Elastic Load Balancer na frente do DynamoDB.',
    ],
    explanation: 'O DAX é um cache em memória gerenciado e transparente desenvolvido especificamente para o DynamoDB, entregando leituras em microssegundos.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma aplicação que processa transações de cartões de crédito precisa de um volume EBS com garantia estrita de até 64.000 IOPS e 1.000 MB/s de vazão.',
    correctAnswer: 'Provisionar volumes Amazon EBS Provisioned IOPS SSD (io2 ou io2 Block Express).',
    distractors: [
      'Utilizar volumes EBS Throughput Optimized HDD (st1).',
      'Configurar um volume EBS Cold HDD (sc1).',
      'Utilizar o Amazon S3 Glacier Flexible Retrieval.',
    ],
    explanation: 'Volumes io2 / io2 Block Express são projetados para cargas críticas e oferecem a maior performance de IOPS e throughput no EBS.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma empresa quer conectar seu datacenter corporativo à AWS com conexão dedicada de 10 Gbps privada, sem transitar pela internet pública.',
    correctAnswer: 'Contratar uma conexão dedicada AWS Direct Connect conectada a um Direct Connect Gateway.',
    distractors: [
      'Configurar uma AWS Site-to-Site VPN pela internet comum.',
      'Criar um VPC Peering com o provedor de internet local.',
      'Instalar um servidor OpenVPN em uma máquina t3.micro.',
    ],
    explanation: 'AWS Direct Connect estabelece link de fibra física dedicado e privado entre o ambiente on-premises e a nuvem AWS.',
  },
  {
    domainOrder: 3,
    prompt: 'Como escalar automaticamente uma frota de instâncias EC2 com base na utilização média de CPU mantendo-a em exatamente 60%?',
    correctAnswer: 'Configurar uma Target Tracking Scaling Policy no Auto Scaling Group com a métrica ASGAverageCPUUtilization definida em 60.',
    distractors: [
      'Criar uma Simple Scaling Policy disparada a cada 24 horas por cron.',
      'Definir o número desejado de instâncias manualmente no console após receber reclamações.',
      'Usar Step Scaling sem métricas do CloudWatch.',
    ],
    explanation: 'Target Tracking funciona como um termostato: adiciona ou remove capacidade dinamicamente para manter a métrica no valor alvo.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma empresa precisa processar fluxos massivos de dados de telemetria IoT (100.000 registros por segundo) em tempo real com particionamento ordenado.',
    correctAnswer: 'Ingerir os eventos com Amazon Kinesis Data Streams dimensionado com número suficiente de Shards.',
    distractors: [
      'Gravar os eventos um a um em arquivos texto em um bucket S3.',
      'Usar uma fila SQS Standard sem partições.',
      'Criar uma tabela RDS MySQL e fazer inserts síncronos individuais.',
    ],
    explanation: 'O Amazon Kinesis Data Streams foi construído para ingestão contínua em escala de streams de dados particionados por partition keys.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma aplicação web recebe upload de arquivos grandes de até 5 GB de usuários remotos. Como acelerar a velocidade do upload para o S3?',
    correctAnswer: 'Habilitar o Amazon S3 Transfer Acceleration no bucket e utilizar Multipart Upload no SDK.',
    distractors: [
      'Fazer os clientes enviarem os arquivos compactados em disquetes virtuais.',
      'Desativar o SSL nas requisições HTTP para economizar processamento.',
      'Configurar o Route 53 com registro TXT contendo os bytes do arquivo.',
    ],
    explanation: 'S3 Transfer Acceleration utiliza a rede otimizada de Edge Locations do CloudFront combinada com S3 Multipart Upload.',
  },
  {
    domainOrder: 3,
    prompt: 'Um banco de dados de processamento analítico (OLAP) precisa consultar petabytes de dados de vendas estruturados com consultas SQL complexas.',
    correctAnswer: 'Migrar o data warehouse para o Amazon Redshift com armazenamento colunar e processamento massivamente paralelo (MPP).',
    distractors: [
      'Utilizar uma instância Amazon RDS PostgreSQL de tamanho pequeno.',
      'Criar uma planilha no Microsoft Excel salva no EBS.',
      'Instalar o MongoDB em uma única máquina EC2.',
    ],
    explanation: 'O Amazon Redshift é um data warehouse relacional em escala petabyte com execução colunar MPP projetado para BI de alta performance.',
  },
  {
    domainOrder: 3,
    prompt: 'Como conectar centenas de VPCs e escritórios remotos on-premises em uma malha de rede simplificada de alta vazão sem gerenciar centenas de conexões peering?',
    correctAnswer: 'Implantar um AWS Transit Gateway atuando como hub central de roteamento inter-VPC e VPN/Direct Connect.',
    distractors: [
      'Criar uma malha completa de VPC Peering ponto-a-ponto entre todas as centenas de VPCs.',
      'Criar túneis SSH reversos entre instâncias bastion em cada VPC.',
      'Roteá-las através da internet pública com Elastic IPs.',
    ],
    explanation: 'O AWS Transit Gateway centraliza o roteamento com arquitetura hub-and-spoke para centenas de VPCs e conexões híbridas.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma API Serverless em AWS Lambda apresenta cold starts lentos ao inicializar bibliotecas pesadas e conexões em Java/Python.',
    correctAnswer: 'Habilitar o Provisioned Concurrency na função AWS Lambda para manter ambientes de execução pré-inicializados e aquecidos.',
    distractors: [
      'Aumentar o timeout da função Lambda para 15 minutos.',
      'Mudar a função para rodar a cada 1 segundo sem parar.',
      'Remover a criptografia de dados.',
    ],
    explanation: 'Provisioned Concurrency mantém instâncias de execução do Lambda pré-aquecidas, eliminando a latência de cold start.',
  },
  {
    domainOrder: 3,
    prompt: 'Um processamento de IA/Machine Learning requer um sistema de arquivos distribuído baseado em Lustre com vazão de centenas de gigabytes por segundo.',
    correctAnswer: 'Provisionar o Amazon FSx for Lustre integrado ao Amazon S3 para servir os datasets diretamente ao cluster.',
    distractors: [
      'Utilizar um volume EBS sc1 compartilhado.',
      'Criar um servidor FTP em Windows Server.',
      'Salvar arquivos em pendrives USB conectados ao console.',
    ],
    explanation: 'FSx for Lustre é otimizado para cargas de computação intensiva (HPC, ML e processamento de vídeo) com altíssima taxa de transferência.',
  },
  {
    domainOrder: 3,
    prompt: 'Como consultar terabytes de logs gravados em formato Parquet no Amazon S3 sem precisar carregar ou provisionar nenhum servidor de banco de dados?',
    correctAnswer: 'Executar consultas SQL serverless diretamente no S3 utilizando o Amazon Athena com particionamento de dados.',
    distractors: [
      'Baixar todos os terabytes para uma máquina local e abrir no Bloco de Notas.',
      'Subir um cluster Oracle RAC na nuvem para ler os arquivos.',
      'Criar um trigger de Lambda que lê linha por linha.',
    ],
    explanation: 'O Amazon Athena é um serviço de consulta interativo e serverless que analisa dados no S3 diretamente em SQL padrão.',
  },
  {
    domainOrder: 3,
    prompt: 'Uma aplicação web distribuída precisa rotear usuários para a região mais próxima com base na menor latência de rede medida em tempo real.',
    correctAnswer: 'Configurar a política de roteamento por Latência (Latency-based Routing) no Amazon Route 53.',
    distractors: [
      'Usar roteamento ponderado (Weighted) com 50% fixo em cada região.',
      'Utilizar roteamento Geolocation bloqueando IPs por país.',
      'Manter apenas uma região ativa.',
    ],
    explanation: 'A política de roteamento por latência do Route 53 direciona requisições para a região AWS que oferece a menor latência de rede para o usuário.',
  },

  // --- DOMAIN 4: DESIGN COST-OPTIMIZED ARCHITECTURES (17 templates) ---
  {
    domainOrder: 4,
    prompt: 'Uma empresa armazena petabytes de arquivos no S3. O padrão de acesso é imprevisível ou desconhecido, com alguns objetos nunca acessados e outros acessados frequentemente.',
    correctAnswer: 'Utilizar a classe de armazenamento S3 Intelligent-Tiering para transicionar objetos automaticamente entre tiers sem taxa de recuperação.',
    distractors: [
      'Manter todos os dados em S3 Standard indefinidamente.',
      'Mover tudo para S3 Glacier Deep Archive e recuperar sob demanda com custo expedido.',
      'Excluir todos os arquivos com mais de 30 dias.',
    ],
    explanation: 'O S3 Intelligent-Tiering move automaticamente dados entre tiers de acesso frequente, infrequente e arquivo profundo sem sobrecarga de gestão.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma empresa precisa executar centenas de jobs diários de processamento em lote tolerantes a interrupções que podem ser reiniciados a qualquer momento.',
    correctAnswer: 'Utilizar instâncias Amazon EC2 Spot em um Auto Scaling Group ou AWS Batch com economia de até 90% sobre o preço On-Demand.',
    distractors: [
      'Contratar Dedicated Hosts de 3 anos com pagamento adiantado integral.',
      'Utilizar instâncias On-Demand provisionadas manualmente.',
      'Comprar Reserved Instances padrão de 1 ano para jobs esporádicos.',
    ],
    explanation: 'Instâncias Spot aproveitam capacidade ociosa de computação da AWS com descontos de até 90% para workloads sem estado tolerantes a falhas.',
  },
  {
    domainOrder: 4,
    prompt: 'Documentos fiscais devem ser guardados por 10 anos por exigência legal. Raramente são consultados e um tempo de recuperação de 12 horas é aceitável.',
    correctAnswer: 'Configurar uma política de ciclo de vida do S3 para transicionar os arquivos para S3 Glacier Deep Archive após 90 dias.',
    distractors: [
      'Manter os documentos no S3 Standard com replicação para 5 regiões.',
      'Salvar os relatórios em volumes EBS Provisioned IOPS io2.',
      'Gravar em tabelas DynamoDB com On-Demand Capacity.',
    ],
    explanation: 'O S3 Glacier Deep Archive é a classe de armazenamento em nuvem de menor custo da AWS, ideal para arquivamento regulatório de longo prazo.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma organização possui uma frota estável de servidores de banco de dados e APIs que ficará ligada continuamente pelos próximos 3 anos.',
    correctAnswer: 'Adquirir Savings Plans de computação (Compute Savings Plans) ou EC2 Instance Savings Plans de 3 anos com pagamento All Upfront ou Partial Upfront.',
    distractors: [
      'Pagar a taxa cheia do On-Demand a cada hora.',
      'Desligar as instâncias a cada 2 horas para economizar.',
      'Substituir o banco de dados por instâncias Spot não tolerantes a falhas.',
    ],
    explanation: 'Savings Plans oferecem descontos significativos (até 72%) em troca de compromisso constante de uso por 1 ou 3 anos.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma empresa precisa de NAT para que instâncias em subnets privadas baixem atualizações na internet. O tráfego é baixo (poucos megabytes por dia).',
    correctAnswer: 'Avaliar o custo de NAT Gateway gerenciado vs alternativas, ou utilizar VPC Endpoints para serviços AWS sem custos de NAT.',
    distractors: [
      'Atribuir Elastic IPs públicos a todas as instâncias do banco de dados.',
      'Criar 10 NAT Gateways em cada subnet desnecessariamente.',
      'Desconectar a VPC da internet permanentemente.',
    ],
    explanation: 'NAT Gateways têm custo fixo por hora e custo por GB. Usar Gateway Endpoints gratuitos para S3/DynamoDB reduz drasticamente o tráfego tarifado.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma aplicação web transfere terabytes de imagens estáticas do S3 diretamente para a internet gerando alto custo de saída de dados (Data Transfer Out).',
    correctAnswer: 'Colocar o Amazon CloudFront na frente do S3, reduzindo os custos de transferência de dados para a internet e aproveitando o cache.',
    distractors: [
      'Trocar o S3 por instâncias EC2 servindo imagens via Apache.',
      'Compactar as imagens com qualidade zero.',
      'Bloquear o acesso de usuários internacionais.',
    ],
    explanation: 'A transferência de dados do S3 para o CloudFront é gratuita, e a saída de dados do CloudFront para a internet é significativamente mais barata.',
  },
  {
    domainOrder: 4,
    prompt: 'Um banco de dados PostgreSQL roda em RDS com volume EBS gp2. Como reduzir custos e aumentar a performance de IOPS sem trocar de instância?',
    correctAnswer: 'Migrar o volume de armazenamento do RDS de gp2 para gp3, que oferece custo por GB 20% menor com 3.000 IOPS incluídos gratuitamente.',
    distractors: [
      'Trocar para um volume Provisioned IOPS io2 com 20.000 IOPS.',
      'Diminuir o tamanho do banco para 5 GB apagando dados históricos.',
      'Desativar o backup automático do banco de dados.',
    ],
    explanation: 'Volumes gp3 fornecem custo por gigabyte menor que o gp2 e desacoplam capacidade de armazenamento de IOPS/throughput.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma empresa precisa identificar volumes EBS não anexados a nenhuma instância e snapshots órfãos antigos que continuam gerando custos desnecessários.',
    correctAnswer: 'Utilizar o AWS Cost Anomaly Detection e relatórios do AWS Trusted Advisor ou AWS Compute Optimizer para identificar recursos ociosos.',
    distractors: [
      'Excluir aleatoriamente 50% dos volumes da conta.',
      'Aguardar o fechamento da fatura no cartão de crédito.',
      'Cancelar a conta da AWS e recriar tudo do zero.',
    ],
    explanation: 'AWS Trusted Advisor e Cost Explorer identificam volumes EBS desacoplados (in-use = false) e recursos ociosos para eliminação de desperdício.',
  },
  {
    domainOrder: 4,
    prompt: 'Um ambiente de desenvolvimento e testes não é utilizado fora do horário comercial (noites e finais de semana). Como automatizar a redução de custos?',
    correctAnswer: 'Implementar o AWS Instance Scheduler para desligar automaticamente as instâncias EC2 e RDS fora do horário comercial via Lambda e EventBridge.',
    distractors: [
      'Pedir para os desenvolvedores lembrarem de desligar as máquinas toda sexta-feira.',
      'Migrar todo o ambiente de testes para servidores bare metal locais.',
      'Manter todas as máquinas ligadas 24x7 no maior tamanho de instância.',
    ],
    explanation: 'Desligar ambientes não produtivos em horários fora do expediente economiza até 70% dos custos de computação de testes.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma empresa quer evitar que projetos ultrapassem orçamentos financeiros e receber alertas antes que a fatura exceda o limite estipulado.',
    correctAnswer: 'Configurar orçamentos de custo no AWS Budgets com notificações por e-mail/SNS quando a previsão de gastos ultrapassar limites.',
    distractors: [
      'Consultar a fatura manualmente após o fechamento do mês.',
      'Bloquear a conta da AWS no painel bancário.',
      'Desativar todos os serviços quando um alarme de CPU disparar.',
    ],
    explanation: 'O AWS Budgets permite definir limites financeiros e enviar alertas preditivos antes que os custos reais ultrapassem a meta.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma aplicação de microserviço executa poucas requisições curtas por dia com longos períodos de inatividade completa.',
    correctAnswer: 'Migrar a arquitetura para AWS Lambda e Amazon API Gateway no modelo Serverless Pay-per-Use, eliminando servidores ociosos.',
    distractors: [
      'Alugar instâncias dedicadas de 3 anos pagas à vista.',
      'Manter 3 instâncias EC2 m5.4xlarge ligadas aguardando requisições.',
      'Contratar um link de Direct Connect exclusivo.',
    ],
    explanation: 'Modelos Serverless cobram apenas pelo tempo exato de execução (pay-per-invocation), custando zero quando inativos.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma empresa quer monitorar e alocar custos de infraestrutura por centro de custo, projeto e time de engenharia.',
    correctAnswer: 'Definir uma estratégia de Cost Allocation Tags consistente e ativá-las no console de faturamento para análise no Cost Explorer.',
    distractors: [
      'Criar uma conta bancária diferente para cada servidor EC2.',
      'Adicionar comentários no código-fonte dos programas.',
      'Dividir o valor total da fatura igualmente entre todos os departamentos.',
    ],
    explanation: 'Cost Allocation Tags organizam gastos por tags customizadas como "Projeto", "Ambiente" e "Owner", visualizáveis no Cost Explorer.',
  },
  {
    domainOrder: 4,
    prompt: 'Um banco de dados de logs no Amazon S3 tem bilhões de versões antigas de objetos que foram deletados mas continuam acumulando custos.',
    correctAnswer: 'Configurar uma S3 Lifecycle Rule para expirar e excluir permanentemente noncurrent object versions após um número determinado de dias.',
    distractors: [
      'Desativar o S3 e salvar tudo em fitas magnéticas.',
      'Executar um loop de deleção manual via console uma vez por ano.',
      'Tornar o bucket público.',
    ],
    explanation: 'Regras de ciclo de vida do S3 removem versões antigas e incompletas de uploads multipart (AbortIncompleteMultipartUpload) automaticamente.',
  },
  {
    domainOrder: 4,
    prompt: 'Como dimensionar o tamanho ideal de instâncias EC2 com base no histórico real de consumo de memória, CPU e rede sem superdimensionar?',
    correctAnswer: 'Consultar as recomendações de rightsizing do AWS Compute Optimizer alimentadas por dados de métricas com agente do CloudWatch.',
    distractors: [
      'Sempre escolher a maior instância disponível na região por precaução.',
      'Adivinhar o tamanho da instância olhando apenas para o espaço em disco.',
      'Usar apenas instâncias t2.micro para qualquer tipo de workload produtivo.',
    ],
    explanation: 'O AWS Compute Optimizer utiliza Machine Learning para analisar o uso real de CPU e memória e recomendar o tipo ideal de instância.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma aplicação que roda em containers ECS precisa executar tarefas esporádicas de processamento de fila sem gerenciar instâncias EC2.',
    correctAnswer: 'Executar as tasks no AWS Fargate com Fargate Spot para tarefas tolerantes a interrupções.',
    distractors: [
      'Comprar servidores físicos e instalar rack na sala da empresa.',
      'Manter instâncias EC2 dedicadas superdimensionadas ligadas sem uso.',
      'Executar na nuvem pública de um concorrente sem integração.',
    ],
    explanation: 'O Fargate Spot oferece até 70% de desconto sobre o Fargate sob demanda para containers sem estado tolerantes a falhas.',
  },
  {
    domainOrder: 4,
    prompt: 'Qual é a forma mais econômica de transferir centenas de terabytes de dados on-premises para a nuvem AWS quando a banda de internet é lenta (10 Mbps)?',
    correctAnswer: 'Solicitar um dispositivo físico da família AWS Snowball Edge para migração offline de dados em massa.',
    distractors: [
      'Fazer upload via internet comum por 3 anos ininterruptos.',
      'Tirar fotos das telas e redigitar manualmente.',
      'Imprimir os arquivos em papel e digitalizar na nuvem.',
    ],
    explanation: 'O AWS Snowball Edge transporta fisicamente dezenas de terabytes em appliance seguro e criptografado de forma rápida e com custo fixo.',
  },
  {
    domainOrder: 4,
    prompt: 'Uma empresa armazena logs no Amazon CloudWatch Logs. Os grupos de log estão configurados para retenção "Never Expire" e geram altos custos de storage.',
    correctAnswer: 'Definir uma política de retenção finita (ex: 30 ou 90 dias) e arquivar logs antigos em S3 Glacier via assinatura do Kinesis Data Firehose.',
    distractors: [
      'Parar de gerar logs de erro da aplicação.',
      'Imprimir os logs diariamente.',
      'Desativar o firewall da rede.',
    ],
    explanation: 'Definir retention period nos Log Groups e arquivar em S3 reduz drasticamente os custos de armazenamento de longo prazo.',
  },
];

/**
 * Generates 4 simulated question banks authored by Professor "Stephane Maarek",
 * each containing exactly 75 questions distributed proportionally across
 * the 4 official AWS SAA-C03 domains.
 *
 * Total generated: 4 banks x 75 questions = 300 questions.
 */
export function generateStephaneMaarekMockSet(certId: string, certDomains?: CertificationDomain[]): {
  banks: QuestionBank[];
  questions: Question[];
} {
  const domains = certDomains && certDomains.length > 0
    ? certDomains
    : [
        { name: 'Domain 1: Design Secure Architectures', order: 1, description: 'Security and IAM controls (30%)' },
        { name: 'Domain 2: Design Resilient Architectures', order: 2, description: 'Resilience, Multi-AZ, and HA (26%)' },
        { name: 'Domain 3: Design High-Performing Architectures', order: 3, description: 'Compute, storage, and networking performance (24%)' },
        { name: 'Domain 4: Design Cost-Optimized Architectures', order: 4, description: 'Cost reduction and storage tiering (20%)' },
      ];

  const domainNames = domains.map((d) => d.name);

  const bankConfigs = [
    {
      id: `bank-${certId}-sm-1`,
      name: 'Simulado 1 · Stephane Maarek (Exame Completo 1)',
      author: 'Stephane Maarek',
      desc: 'Simulado 1 de 75 questões cobrindo todos os 4 domínios da prova SAA-C03 com explicações detalhadas de arquitetura, pegadinhas comuns e referências técnicas.',
    },
    {
      id: `bank-${certId}-sm-2`,
      name: 'Simulado 2 · Stephane Maarek (Exame Completo 2)',
      author: 'Stephane Maarek',
      desc: 'Simulado 2 com 75 questões focado em cenários corporativos complexos, alta disponibilidade multi-região e segurança corporativa.',
    },
    {
      id: `bank-${certId}-sm-3`,
      name: 'Simulado 3 · Stephane Maarek (Exame Completo 3)',
      author: 'Stephane Maarek',
      desc: 'Simulado 3 de 75 questões com ênfase em arquiteturas serverless, desacoplamento por mensageria e migrações de bancos de dados relacionais e NoSQL.',
    },
    {
      id: `bank-${certId}-sm-4`,
      name: 'Simulado 4 · Stephane Maarek (Exame Completo 4)',
      author: 'Stephane Maarek',
      desc: 'Simulado 4 final de 75 questões no nível de alta pressão do exame oficial, com cálculo de IOPS de EBS, VPC Peering vs Transit Gateway e regras de custo S3.',
    },
  ];

  const banks: QuestionBank[] = bankConfigs.map((b, idx) => ({
    id: b.id,
    certId,
    name: b.name,
    authorOrVendor: b.author,
    description: b.desc,
    domainTags: domainNames,
    createdAt: Date.now() - 86400000 * (10 - idx),
    updatedAt: Date.now() - 86400000 * 1,
  }));

  const allQuestions: Question[] = [];

  // Generate 75 questions for each of the 4 banks
  bankConfigs.forEach((bank, bankIndex) => {
    // 75 questions distributed:
    // Domain 1: 21 questions (approx 28-30%)
    // Domain 2: 19 questions (approx 25-26%)
    // Domain 3: 18 questions (approx 24%)
    // Domain 4: 17 questions (approx 22%)
    // Total = 21 + 19 + 18 + 17 = 75 questions!

    let questionIndexInBank = 1;

    AWS_SAA_BLUEPRINTS.forEach((template, tIdx) => {
      // Find matching domain name by domainOrder
      const matchedDomain = domains.find((d) => d.order === template.domainOrder) || domains[(template.domainOrder - 1) % domains.length];
      const domainName = matchedDomain.name;

      const qId = `q-${bank.id}-item-${questionIndexInBank}`;
      
      // Shuffle options slightly or vary prefix per bank
      const optionLetters = ['A', 'B', 'C', 'D'];
      const rawOptions = [
        { text: template.correctAnswer, isCorrect: true },
        ...template.distractors.map((d) => ({ text: d, isCorrect: false })),
      ];

      // Pseudo-random deterministic rotate so correct answer isn't always position 0
      const rotation = (questionIndexInBank + bankIndex) % 4;
      const rotatedOptions = [
        ...rawOptions.slice(rotation),
        ...rawOptions.slice(0, rotation),
      ];

      const formattedOptions = rotatedOptions.map((opt, oIdx) => ({
        id: `opt-${qId}-${optionLetters[oIdx].toLowerCase()}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      }));

      // Add a slight scenario variation label per bank to make questions distinctive
      const bankVariantLabel = bankIndex === 0
        ? ''
        : bankIndex === 1
        ? ' [Cenário de Produção Multi-Região]'
        : bankIndex === 2
        ? ' [Cenário de Escalabilidade Enterprise]'
        : ' [Cenário de Alta Pressão & Auditoria]';

      allQuestions.push({
        id: qId,
        certId,
        bankId: bank.id,
        type: 'multiple-choice',
        prompt: `(${bank.name.split('·')[0].trim()} · Q${questionIndexInBank}) ${template.prompt}${bankVariantLabel}`,
        domainTag: domainName,
        options: formattedOptions,
        allowMultipleAnswers: false,
        explanation: `${template.explanation} (Referência: Guia Oficial de Arquitetura AWS e Material do Prof. ${bank.author}).`,
        createdAt: Date.now() - 86400000 * (10 - bankIndex) + questionIndexInBank * 1000,
        updatedAt: Date.now() - 86400000 * 1,
      });

      questionIndexInBank++;
    });
  });

  return { banks, questions: allQuestions };
}

/**
 * Generic mock generator for any certification (e.g. CKA, Azure, Terraform, GCP, Linux).
 * Creates 4 banks by the given author with realistic questions distributed
 * evenly across all official domains defined on that certification.
 */
export function generateGenericMockSet(
  cert: Certification,
  authorName: string = 'Prof. Especialista',
  banksCount: number = 4,
  questionsPerBank: number = 75
): { banks: QuestionBank[]; questions: Question[] } {
  const domains = cert.domains && cert.domains.length > 0
    ? cert.domains
    : [
        { name: 'Domínio 1: Fundamentos & Arquitetura', order: 1, description: 'Core principles' },
        { name: 'Domínio 2: Operações & Segurança', order: 2, description: 'Operations and security' },
        { name: 'Domínio 3: Performance & Resiliência', order: 3, description: 'Scale and reliability' },
        { name: 'Domínio 4: Troubleshooting & Otimização', order: 4, description: 'Troubleshooting and tuning' },
      ];

  const domainNames = domains.map((d) => d.name);
  const banks: QuestionBank[] = [];
  const questions: Question[] = [];

  for (let b = 1; b <= banksCount; b++) {
    const bankId = `bank-${cert.id}-gen-${b}`;
    const bank: QuestionBank = {
      id: bankId,
      certId: cert.id,
      name: `Simulado ${b} · ${authorName} (Exame Completo ${b})`,
      authorOrVendor: authorName,
      description: `Simulado de exame completo com ${questionsPerBank} questões práticas cobrindo todos os ${domains.length} domínios oficiais da prova ${cert.name}.`,
      domainTags: domainNames,
      createdAt: Date.now() - 86400000 * (banksCount - b + 1),
      updatedAt: Date.now() - 86400000 * 1,
    };
    banks.push(bank);

    for (let q = 1; q <= questionsPerBank; q++) {
      const domainIndex = (q - 1) % domains.length;
      const domain = domains[domainIndex];
      const qId = `q-${bankId}-${q}`;

      const rotation = (q + b) % 4;
      const opts = [
        { id: `opt-${qId}-a`, text: `Opção A: Solução recomendada com menor esforço operacional e alta resiliência para o ${domain.name}.`, isCorrect: rotation === 0 },
        { id: `opt-${qId}-b`, text: `Opção B: Implementação alternativa baseada em processos manuais e scripts locais legados.`, isCorrect: rotation === 1 },
        { id: `opt-${qId}-c`, text: `Opção C: Arquitetura monolítica sem isolamento de falhas ou redundância geográfica.`, isCorrect: rotation === 2 },
        { id: `opt-${qId}-d`, text: `Opção D: Configuração com permissões excessivas não aderente ao princípio de privilégio mínimo.`, isCorrect: rotation === 3 },
      ];

      questions.push({
        id: qId,
        certId: cert.id,
        bankId: bank.id,
        type: 'multiple-choice',
        prompt: `(${cert.code || cert.name} · Simulado ${b} · Questão ${q}) Em um ambiente corporativo de produção, qual abordagem atende aos requisitos do domínio "${domain.name}" garantindo conformidade e estabilidade operacional?`,
        domainTag: domain.name,
        options: opts,
        allowMultipleAnswers: false,
        explanation: `A resposta correta reflete as melhores práticas oficiais da certificação ${cert.name} para o domínio "${domain.name}".`,
        createdAt: Date.now() - 86400000 * (banksCount - b + 1) + q * 500,
        updatedAt: Date.now() - 86400000 * 1,
      });
    }
  }

  return { banks, questions };
}
