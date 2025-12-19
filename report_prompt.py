import json

def load_system_instructions():
    try:
        with open("instrucoes_astro.md", "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Erro ao carregar instruções do sistema: {e}")
        return "Você é um assistente de astrologia."

def get_report_prompt(name: str, map_data: dict, question: str = None) -> str:
    """
    Gera o prompt completo para o relatório astrológico.
    """
    system_instructions = load_system_instructions()
    
    map_data_str = json.dumps(map_data, ensure_ascii=False, indent=2)
    
    prompt = f"""{system_instructions}

DADOS DO MAPA DE {name}:
{map_data_str}

"""
    
    if question:
        prompt += f"""
PERGUNTA ESPECÍFICA DO USUÁRIO:
"{question}"

Por favor, inclua uma seção final respondendo especificamente a esta pergunta, relacionando com os dados do mapa.
"""

    return prompt
