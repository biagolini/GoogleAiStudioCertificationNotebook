import { GoogleGenAI } from '@google/genai';
import { Question } from '../types';

const STORAGE_KEY_GEMINI_API_KEY = 'certstudy_gemini_api_key_v1';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  proposedMarkdown?: string;
  timestamp: number;
}

class GeminiService {
  private customApiKey: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.customApiKey = localStorage.getItem(STORAGE_KEY_GEMINI_API_KEY) || null;
    }
  }

  public getApiKey(): string {
    if (this.customApiKey && this.customApiKey.trim()) {
      return this.customApiKey.trim();
    }
    // Fallback to Vite environment variable if configured
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) {
      return envKey.trim();
    }
    return '';
  }

  public setApiKey(key: string): void {
    const trimmed = key.trim();
    this.customApiKey = trimmed || null;
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY_GEMINI_API_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY_GEMINI_API_KEY);
      }
    }
  }

  public hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  public getClient(keyOverride?: string): GoogleGenAI {
    const key = keyOverride?.trim() || this.getApiKey();
    if (!key) {
      throw new Error('MISSING_API_KEY');
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public async testConnection(keyOverride?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const client = this.getClient(keyOverride);
      const res = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Hello! Respond with: OK',
      });
      if (res && res.text) {
        return { success: true };
      }
      return { success: false, message: 'No response from model' };
    } catch (err: any) {
      const msg = err?.message || String(err);
      return { success: false, message: msg };
    }
  }

  /**
   * Explain a certification question, breakdown distractors, and answer user doubts.
   */
  public async explainQuestion(params: {
    question: Question;
    userSelectedOptionTexts?: string[];
    userDoubt?: string;
    certName?: string;
    language?: string;
    conversationHistory?: { role: 'user' | 'model'; text: string }[];
  }): Promise<string> {
    const client = this.getClient();
    const { question, userSelectedOptionTexts, userDoubt, certName, language = 'pt-BR', conversationHistory = [] } = params;

    const isPt = language.startsWith('pt');

    const systemInstruction = isPt
      ? `Você é o Tutor de Especialização e Certificações da CertStudy.
Seu objetivo é ajudar o aluno a entender a fundo esta questão de exame de certificação profissional (${certName || 'Certificação Técnica'}).
Diretrizes:
1. Explique com clareza cristalina por que a resposta correta é a melhor solução segundo as melhores práticas do exame.
2. Explique detalhadamente por que as outras opções (distratores) são incorretas, inviáveis ou pegadinhas comuns da banca.
3. Se o aluno errou ou selecionou outra opção, aponte onde esteve a confusão conceitual.
4. Destaque palavras-chave do enunciado (ex: "mais econômico", "menor sobrecarga operacional", "alta disponibilidade").
5. Mantenha um tom didático, encorajador e direto ao ponto. Use formatação Markdown (negrito, listas, blocos de código se aplicável).`
      : `You are the CertStudy Professional Certification & Exam Tutor.
Your goal is to help the student deeply understand this certification exam question (${certName || 'Professional Certification'}).
Guidelines:
1. Clearly explain why the correct option is the best solution per exam blueprint and industry best practices.
2. Explain why other options (distractors) are incorrect, suboptimal, or common exam traps.
3. If the student picked another answer, point out the conceptual difference.
4. Highlight keyword triggers in the question stem (e.g. "most cost-effective", "least operational overhead", "fault-tolerant").
5. Be didactic, encouraging, and actionable. Use Markdown with bullet points and code blocks if applicable.`;

    // Construct the context of the question
    let promptContext = `### Questão do Exame\n\n**Enunciado:**\n${question.prompt}\n\n`;

    if (question.domainTag) {
      promptContext += `**Domínio do Exame:** ${question.domainTag}\n\n`;
    }

    if (question.options && question.options.length > 0) {
      promptContext += `**Alternativas:**\n`;
      question.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        promptContext += `- **${letter})** ${opt.text} ${opt.isCorrect ? '*(Correta / Gabarito)*' : ''}\n`;
      });
      promptContext += `\n`;
    }

    if (question.flashcard) {
      promptContext += `**Resposta Esperada:**\n${question.flashcard.backAnswer}\n\n`;
    }

    if (question.explanation) {
      promptContext += `**Explicação Oficial do Banco:**\n${question.explanation}\n\n`;
    }

    if (userSelectedOptionTexts && userSelectedOptionTexts.length > 0) {
      promptContext += `**Opção selecionada pelo aluno:**\n${userSelectedOptionTexts.join(', ')}\n\n`;
    }

    if (userDoubt) {
      promptContext += `**Dúvida específica do aluno:**\n"${userDoubt}"\n\n`;
    } else {
      promptContext += isPt
        ? `Por favor, faça uma análise didática desta questão: explique a resposta correta, por que as outras estão erradas e qual é a dica-chave para não errar no dia da prova.`
        : `Please provide a didactic walkthrough: explain why the correct answer is right, why the others are wrong, and provide a key exam tip.`;
    }

    // Prepare contents
    const contents: any[] = [];
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      });
      // Append current doubt
      contents.push({
        role: 'user',
        parts: [{ text: promptContext }],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: promptContext }],
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    return response.text || (isPt ? 'Não foi possível obter resposta do Gemini.' : 'No response from Gemini.');
  }

  /**
   * Note Assistant: reads the active markdown note, answers questions, generates summaries,
   * flashcards, or directly outputs improved markdown that can be applied to the note.
   */
  public async assistNote(params: {
    noteTitle: string;
    noteContent: string;
    userPrompt: string;
    action?: 'custom' | 'improve' | 'summarize' | 'expand' | 'flashcards' | 'exam_tips';
    certName?: string;
    language?: string;
    conversationHistory?: { role: 'user' | 'model'; text: string }[];
  }): Promise<{ responseText: string; proposedMarkdown?: string }> {
    const client = this.getClient();
    const {
      noteTitle,
      noteContent,
      userPrompt,
      action = 'custom',
      certName,
      language = 'pt-BR',
      conversationHistory = [],
    } = params;

    const isPt = language.startsWith('pt');

    const systemInstruction = isPt
      ? `Você é o Copiloto de Notas de Estudo com Gemini para Certificações Técnicas da CertStudy.
Você tem acesso ao texto Markdown que o aluno está editando no momento.
Suas funções são:
1. Ler e analisar o conteúdo da nota de estudo ("${noteTitle}").
2. Tirar dúvidas, aprofundar conceitos técnicos, arquiteturas, comandos CLI e regras de exame.
3. Quando o usuário pedir para formatar, melhorar, resumir, expandir ou criar novo conteúdo para a nota, forneça uma explicação conversacional curta E forneça a versão em Markdown pronta para ser inserida ou substituída na nota.
4. REGRA DE FORMATAÇÃO PARA CONTEÚDO EDITÁVEL NA NOTA:
   Sempre que você sugerir um texto Markdown para ser colocado diretamente na nota do usuário, coloque-o OBRIGATORIAMENTE dentro de um bloco delimitado exatamente por:
   <<<MARKDOWN_NOTE_START>>>
   (seu texto markdown formatado aqui)
   <<<MARKDOWN_NOTE_END>>>
   Isso permite que a interface mostre os botões "Substituir Nota", "Inserir no Cursor" e "Adicionar ao Final" com 1 clique.
5. Se for apenas uma conversa/dúvida onde não há novo texto a ser gravado na nota, responda naturalmente em Markdown sem os delimitadores.`
      : `You are the CertStudy AI Study Note Copilot for Technical Certification preparation.
You have direct read access to the student's active Markdown study note ("${noteTitle}").
Your roles:
1. Read and analyze the current note content.
2. Answer questions, clarify technical concepts, architectures, CLI commands, and exam blueprints.
3. When asked to format, polish, summarize, expand, or write content for the note, provide a short conversational commentary AND provide the ready-to-use Markdown content.
4. EDITABLE NOTE CONTENT FORMAT RULE:
   Whenever you suggest Markdown content intended to be applied directly to the user's note, you MUST enclose it within:
   <<<MARKDOWN_NOTE_START>>>
   (your clean markdown text here)
   <<<MARKDOWN_NOTE_END>>>
   This allows the user to apply it with one click ("Replace Note", "Append to Note", etc.).
5. If answering a conceptual question without proposing note edits, reply normally in Markdown without delimiters.`;

    let actionPrompt = userPrompt;
    if (action === 'improve') {
      actionPrompt = isPt
        ? 'Por favor, revise e melhore a organização desta nota: corrija a formatação Markdown, organize tópicos com títulos e subtítulos claros, adicione listas e destaques para os pontos mais importantes para a prova.'
        : 'Please review and polish the formatting of this study note: organize headers, bullet points, and highlight key takeaways.';
    } else if (action === 'summarize') {
      actionPrompt = isPt
        ? 'Gere um resumo executivo de alta densidade (Cheat Sheet / Key Takeaways) com os 5 a 7 pontos fundamentais desta nota para revisão rápida pré-prova.'
        : 'Generate a high-yield executive summary / cheat sheet of key takeaways from this note for pre-exam review.';
    } else if (action === 'flashcards') {
      actionPrompt = isPt
        ? 'Extraia desta nota 4 a 6 perguntas e respostas no estilo flashcard (pergunta prática na frente, resposta técnica no verso) para memorização ativa.'
        : 'Extract 4 to 6 flashcards (practical question and concise technical answer) from this note for active recall.';
    } else if (action === 'expand') {
      actionPrompt = isPt
        ? 'Aprofunde e expanda o conteúdo desta nota: adicione detalhes técnicos arquiteturais, casos de uso recomendados vs não recomendados e comandos/configurações relevantes para a prova.'
        : 'Deepen and expand this note with architectural details, recommended use cases, and relevant configurations/commands.';
    } else if (action === 'exam_tips') {
      actionPrompt = isPt
        ? 'Quais são as principais pegadinhas e dicas de prova relacionadas aos tópicos desta nota? Adicione uma seção de dicas de exame.'
        : 'What are the main exam traps and blueprint tips related to the topics in this note? Add an exam tips section.';
    }

    const currentNoteContext = `### Informações da Nota Atual:
- **Título**: ${noteTitle || 'Sem título'}
- **Certificação Alvo**: ${certName || 'Certificação Técnica'}
- **Conteúdo Markdown Atual da Nota**:
\`\`\`markdown
${noteContent || '(Nota vazia)'}
\`\`\`

### Solicitação do Usuário:
${actionPrompt}`;

    const contents: any[] = [];
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((m) => {
        contents.push({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }],
        });
      });
      contents.push({
        role: 'user',
        parts: [{ text: currentNoteContext }],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: currentNoteContext }],
      });
    }

    const res = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const rawText = res.text || '';

    // Extract proposed markdown block if present
    const regex = /<<<MARKDOWN_NOTE_START>>>([\s\S]*?)<<<MARKDOWN_NOTE_END>>>/;
    const match = rawText.match(regex);
    let proposedMarkdown: string | undefined;
    let cleanResponse = rawText;

    if (match && match[1]) {
      proposedMarkdown = match[1].trim();
      // Keep commentary or clean it up nicely
      cleanResponse = rawText.replace(regex, '').trim();
      if (!cleanResponse) {
        cleanResponse = isPt
          ? 'Aqui está a versão formatada pronta para a sua nota:'
          : 'Here is the formatted content ready for your note:';
      }
    }

    return {
      responseText: cleanResponse,
      proposedMarkdown,
    };
  }

  /**
   * Parse an uploaded exam document (.html, .md, or unzipped text) into structured questions.
   * Handles batching for large documents (e.g. 50-75 questions) to avoid truncation.
   */
  public async parseQuestionsFromDocument(params: {
    documentText: string;
    expectedCount: number;
    certName?: string;
    certDomains?: string[];
    onProgress?: (info: { stage: string; percent: number }) => void;
  }): Promise<
    Array<{
      prompt: string;
      type: 'multiple-choice' | 'scenario' | 'flashcard';
      domainTag: string;
      options: Array<{ id: string; text: string; isCorrect: boolean }>;
      allowMultipleAnswers?: boolean;
      explanation?: string;
    }>
  > {
    const client = this.getClient();
    const { documentText, expectedCount, certName, certDomains = [], onProgress } = params;

    const domainsListStr = certDomains.length > 0 ? certDomains.join(', ') : 'Geral, Arquitetura, Segurança, Operações';

    // Helper to extract questions from a text segment using gemini-3.8-flash
    const parseSegment = async (
      textChunk: string,
      chunkIndex: number,
      totalChunks: number
    ): Promise<any[]> => {
      const systemInstruction = `You are a high-precision Exam Document Parser for technical certifications (${certName || 'Technical Certification'}).
Your task is to parse all practice questions present in the provided document chunk into a JSON array of structured questions.
Available Exam Domains for tagging: [${domainsListStr}].

JSON Schema Requirements:
Return a JSON array containing:
[
  {
    "prompt": "Full question statement/stem with scenarios, diagrams, or code blocks if present",
    "type": "multiple-choice" or "scenario",
    "domainTag": "Best matching domain from the list above",
    "allowMultipleAnswers": boolean (true if question states 'Select TWO' or requires multiple answers),
    "options": [
      {
        "id": "opt-1",
        "text": "Option text without the letter prefix",
        "isCorrect": boolean (true if this option is the correct answer according to the document or key)
      }
    ],
    "explanation": "Detailed explanation or justification if provided in the document"
  }
]

CRITICAL RULES:
1. Extract ALL questions in this segment. Do not skip questions.
2. For multiple choice, include ALL alternatives (A, B, C, D, etc.).
3. Accurately identify which options are marked correct (look for '(Correct)', 'Answer: B', bold text, checks, or explanation sections).
4. If explanation is found at the end of the question, place it in 'explanation'.
5. Only return the valid JSON array.`;

      const prompt = `Please parse the following certification exam document segment (Part ${chunkIndex + 1} of ${totalChunks}):\n\n${textChunk}`;

      const res = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const raw = res.text || '[]';
      try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('Failed to parse JSON chunk:', err, raw);
        return [];
      }
    };

    // Determine chunking based on text length and expected count
    // A single chunk works up to ~25 questions or ~35,000 characters
    const textLength = documentText.length;
    let chunks: string[] = [];

    // Attempt intelligent splitting by question boundaries (e.g., "Question 1", "Questão 1", "Q1.", etc.)
    const questionRegex = /(?=(?:^|\n)(?:Question|Questão|Q\.?|#)\s*\d+[\.\:\-\)])|(?=(?:^|\n)\d+[\.\:\-\)]\s+[A-Z\u00C0-\u00FF])/gi;
    const splitSections = documentText.split(questionRegex).filter((s) => s.trim().length > 30);

    if (splitSections.length >= 4 && (expectedCount > 20 || textLength > 30000)) {
      // Group split sections into batches of ~12 to 18 questions
      const batchSize = expectedCount > 50 ? 12 : 15;
      for (let i = 0; i < splitSections.length; i += batchSize) {
        chunks.push(splitSections.slice(i, i + batchSize).join('\n\n'));
      }
    } else if (textLength > 35000 || expectedCount > 25) {
      // Divide by character length
      const targetChunkSize = 25000;
      let start = 0;
      while (start < textLength) {
        let end = start + targetChunkSize;
        if (end < textLength) {
          // Find double newline to break cleanly
          const breakPoint = documentText.lastIndexOf('\n\n', end);
          if (breakPoint > start + 10000) {
            end = breakPoint;
          }
        }
        chunks.push(documentText.substring(start, end));
        start = end;
      }
    } else {
      chunks = [documentText];
    }

    const allParsedQuestions: any[] = [];
    const totalChunks = chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      if (onProgress) {
        const pct = Math.round(((i) / totalChunks) * 85) + 10;
        onProgress({
          stage: `Processando lote ${i + 1} de ${totalChunks} com Gemini AI...`,
          percent: pct,
        });
      }

      const chunkResults = await parseSegment(chunks[i], i, totalChunks);
      allParsedQuestions.push(...chunkResults);
    }

    if (onProgress) {
      onProgress({
        stage: 'Finalizando formatação das questões...',
        percent: 98,
      });
    }

    // Format & Normalize questions into CertStudy schema
    const formattedQuestions = allParsedQuestions.map((q, idx) => {
      const options = Array.isArray(q.options)
        ? q.options.map((opt: any, optIdx: number) => ({
            id: `opt-${optIdx + 1}`,
            text: String(opt.text || '').trim(),
            isCorrect: Boolean(opt.isCorrect),
          }))
        : [];

      // Ensure at least one correct option exists if options are present
      if (options.length > 0 && !options.some((o: any) => o.isCorrect)) {
        options[0].isCorrect = true; // Fallback so questions remain usable
      }

      const domain = q.domainTag && q.domainTag.trim()
        ? q.domainTag.trim()
        : certDomains[idx % Math.max(1, certDomains.length)] || 'General';

      return {
        prompt: String(q.prompt || `Questão ${idx + 1}`).trim(),
        type: (q.type === 'scenario' ? 'scenario' : 'multiple-choice') as 'multiple-choice' | 'scenario' | 'flashcard',
        domainTag: domain,
        options,
        allowMultipleAnswers: Boolean(q.allowMultipleAnswers || (options.filter((o: any) => o.isCorrect).length > 1)),
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
      };
    });

    return formattedQuestions;
  }

  private translationCache = new Map<
    string,
    {
      prompt: string;
      options?: Array<{ id: string; text: string; explanation?: string; comment?: string }>;
      explanation?: string;
    }
  >();

  /**
   * Translates an exam question, its options, comments, and explanation into the student's native language.
   * Caches results in memory so toggling back and forth is instantaneous.
   */
  public async translateQuestion(
    question: Question,
    targetLanguage: string = 'pt-BR'
  ): Promise<{
    prompt: string;
    options?: Array<{ id: string; text: string; explanation?: string; comment?: string }>;
    explanation?: string;
  }> {
    const cacheKey = `${question.id}_${targetLanguage}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    const client = this.getClient();
    const isTargetPt = targetLanguage.startsWith('pt');
    const targetLangName = isTargetPt ? 'Português (Brasil)' : targetLanguage;

    const payloadToTranslate = {
      prompt: question.prompt,
      options: question.options?.map((opt) => ({
        id: opt.id,
        text: opt.text,
        comment: opt.comment || opt.explanation || '',
      })),
      explanation: question.explanation || '',
    };

    const systemInstruction = `You are a high-fidelity Technical Translation Engine for IT & Cloud Certification Exams.
Translate the following exam question stem, options, per-option comments, and general explanation into ${targetLangName}.
Preserve exact cloud and technical terms (e.g. AWS service names: CloudTrail, S3, SCP, EC2, IAM, GuardDuty, VPC, Transit Gateway; Kubernetes terms: Pod, Deployment, ConfigMap, Kubelet).
Do not translate command line syntax, flags, code blocks, or policy JSON keys.
Return ONLY a valid JSON object matching this structure:
{
  "prompt": "translated question prompt",
  "options": [
    { "id": "opt-1", "text": "translated option text", "comment": "translated comment explaining this option" }
  ],
  "explanation": "translated general explanation"
}`;

    const res = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: JSON.stringify(payloadToTranslate),
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const raw = res.text || '{}';
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      const result = {
        prompt: parsed.prompt || question.prompt,
        options: parsed.options || question.options,
        explanation: parsed.explanation || question.explanation,
      };

      this.translationCache.set(cacheKey, result);
      return result;
    } catch {
      return {
        prompt: question.prompt,
        options: question.options,
        explanation: question.explanation,
      };
    }
  }
}

export const geminiService = new GeminiService();
