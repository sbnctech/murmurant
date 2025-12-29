# Starling SLM Architecture

```
Status: PROPOSAL
Purpose: Cost-effective, grounded chatbot without high LLM API fees
Audience: Engineering, Operations
```

---

## Problem Statement

We want Starling (the Murmurant chatbot) to:
- Answer questions about Murmurant features and organization policies
- Stay grounded in our knowledge base (no hallucinations)
- Avoid high per-token API costs (OpenAI GPT-4 = ~$30/1M tokens)

---

## Recommended Architecture: RAG + Small Language Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Question                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. RETRIEVAL LAYER                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Embedding  │───▶│   Vector    │───▶│  Top-K Relevant     │ │
│  │   Model     │    │   Search    │    │  Documents          │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                 │
│  Knowledge Base:                                                │
│  - docs/runbooks/*.md (how-to guides)                          │
│  - Organization policies (from database)                        │
│  - FAQ content                                                  │
│  - Help articles                                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. GENERATION LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Small Language Model (7B-8B parameters)                    ││
│  │  - Mistral 7B or Llama 3.1 8B or Phi-4                     ││
│  │  - Quantized (4-bit) for efficiency                        ││
│  │  - Runs via Ollama                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Prompt Template:                                               │
│  "You are Starling, the Murmurant assistant.                   │
│   Answer using ONLY the context below.                         │
│   If unsure, say you don't know.                               │
│   Context: {retrieved_documents}                               │
│   Question: {user_question}"                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Response                                │
│  - Grounded in retrieved documents                             │
│  - Includes source citations                                   │
│  - Follows Starling voice guidelines                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Model Recommendations

### Small Language Models (SLMs)

| Model | Parameters | Strengths | RAM Required |
|-------|------------|-----------|--------------|
| **Mistral 7B** | 7B | Fast, efficient, good instruction-following | 8-12 GB |
| **Llama 3.1 8B** | 8B | Strong reasoning, 128K context | 8-12 GB |
| **Phi-4 Mini** | 3.8B | Tiny but capable, good for edge | 4-6 GB |
| **Ministral 8B** | 8B | 128K context, function-calling | 8-12 GB |

**Recommendation:** Start with **Mistral 7B** (quantized 4-bit). Best balance of quality, speed, and resource usage.

### Embedding Models (for retrieval)

| Model | Dimensions | Notes |
|-------|------------|-------|
| **nomic-embed-text** | 768 | Open source, runs in Ollama |
| **bge-small-en** | 384 | Very fast, good for English |
| **all-MiniLM-L6** | 384 | Popular, battle-tested |

---

## Deployment Options

### Option A: Self-Hosted (Lowest Cost)

**Infrastructure:**
- Ollama running on a VPS with 16GB RAM + GPU (or Apple Silicon Mac Mini)
- PostgreSQL with pgvector extension (already using Neon)

**Estimated Costs:**
- VPS with GPU: ~$50-100/month (Hetzner, Lambda Labs)
- Or Mac Mini M2 Pro: ~$1,300 one-time + $10/month hosting

**Pros:**
- Zero per-token costs
- Complete data privacy
- No API rate limits

**Cons:**
- Hardware management
- Need to update models manually

### Option B: Managed Open-Source APIs (Low Cost)

**Providers:**
- **Groq**: ~$0.05/1M tokens (fastest, cheapest)
- **Together.ai**: ~$0.10-0.20/1M tokens (recommended alternative)
- **Fireworks.ai**: ~$0.10-0.20/1M tokens
- **Replicate**: Pay-per-second inference

Note: Groq (AI chip company) is unrelated to Grok (xAI/Musk chatbot).

**Estimated Costs:**
- Light usage (100K tokens/month): ~$5-10/month
- Medium usage (1M tokens/month): ~$20-50/month

**Pros:**
- No hardware to manage
- Easy scaling
- Access to multiple models

**Cons:**
- Still has per-token costs (but 10-100x cheaper than GPT-4)

### Option C: Hybrid (Recommended for Murmurant)

**Architecture:**
1. **Retrieval**: Self-hosted embeddings + pgvector in Neon
2. **Generation**: Groq or Together.ai for SLM inference
3. **Fallback**: OpenAI only for edge cases that SLM can't handle

**Estimated Monthly Cost:** $20-40/month for typical club usage

---

## Knowledge Base Strategy

### What to Index

| Source | Content | Update Frequency |
|--------|---------|------------------|
| `docs/runbooks/` | How-to guides | On deploy |
| `docs/brand/MURMURANT_FAQ.md` | General FAQ | On deploy |
| Organization policies | Bylaws, rules | On admin update |
| Event descriptions | Current events | On event publish |
| Help articles | Feature docs | On deploy |

### Chunking Strategy

```
Document → Semantic Chunks (300-500 tokens each)
         → Preserve section headers
         → Include source metadata
```

### Grounding Enforcement

1. **Retrieval-only answers**: Generate from retrieved context only
2. **Confidence scoring**: If retrieval confidence < threshold, say "I don't know"
3. **Citation requirement**: Always cite the source document
4. **Forbidden phrases**: Never say "I think" or make claims beyond context

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Set up pgvector in Neon database
- [ ] Create embedding pipeline for docs
- [ ] Build retrieval API endpoint

### Phase 2: Generation (Week 3-4)
- [ ] Integrate Groq or Together.ai
- [ ] Create Starling prompt template
- [ ] Implement streaming responses

### Phase 3: Integration (Week 5-6)
- [ ] Build ChatWidget UI (per CHAT_WIDGET_OPEN_SOURCE_OPTIONS.md)
- [ ] Connect to retrieval + generation
- [ ] Add audit logging

### Phase 4: Refinement (Ongoing)
- [ ] Monitor response quality
- [ ] Expand knowledge base
- [ ] Tune retrieval parameters

---

## Cost Comparison

| Approach | Setup Cost | Monthly Cost | Quality |
|----------|------------|--------------|---------|
| OpenAI GPT-4 | $0 | $100-500+ | Excellent |
| **Groq + Mistral 7B** | **$0** | **$15-30** | **Good** |
| Together.ai + Mistral 7B | $0 | $20-40 | Good |
| Self-hosted Ollama | $1,300 | $10 | Good |
| Hybrid (recommended) | $0 | $25-40 | Good+ |

For Murmurant's typical usage (a few thousand queries/month), the **Hybrid approach** keeps costs under $50/month while maintaining quality.

---

## Grounding: How We Prevent Hallucination

1. **Strict retrieval context**: Model only sees relevant docs, not trained knowledge
2. **System prompt enforcement**: "Use ONLY the provided context"
3. **No-knowledge fallback**: If retrieval returns nothing relevant, say so
4. **Source attribution**: Every answer cites its source
5. **Confidence threshold**: Low-confidence retrievals trigger "I don't know"

Example prompt:
```
You are Starling, the Murmurant assistant. You are helpful, direct, and honest.

CRITICAL: Answer using ONLY the context provided below.
- If the context doesn't contain the answer, say "I don't have information about that."
- Never make up information.
- Always cite which document your answer comes from.

Context:
{retrieved_chunks}

User question: {question}
```

---

## Related Documents

- [CHATBOT_PLUGIN_SPEC.md](./CHATBOT_PLUGIN_SPEC.md) - Chatbot capabilities and safety
- [CHATBOT_SAFETY_CONTRACT.md](./CHATBOT_SAFETY_CONTRACT.md) - What Starling can/cannot do
- [VOICE_AND_MESSAGING.md](../brand/VOICE_AND_MESSAGING.md) - Starling personality
- [BRAND_AND_VOICE.md](../BIZ/BRAND_AND_VOICE.md) - Product behavior as brand

---

## Sources

- [Open Source LLMs Comparison](https://huggingface.co/blog/daya-shankar/open-source-llms)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Ollama Pricing & Costs](https://skywork.ai/blog/llm/is-ollama-free-pricing-costs-hardware-requirements/)
- [Local LLM Hosting Guide 2025](https://www.glukhov.org/post/2025/11/hosting-llms-ollama-localai-jan-lmstudio-vllm-comparison/)
- [Best Open Source SLMs](https://www.bentoml.com/blog/the-best-open-source-small-language-models)

---

*Last updated: December 2025*
