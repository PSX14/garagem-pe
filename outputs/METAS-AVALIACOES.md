# Garagem PE — roteiro das avaliações

Preparado em **05/11/2026**, a partir da tabela fornecida pelo professor. Este documento relaciona o código às metas e orienta a demonstração; não comprova presença ou realização das avaliações anteriores.

## 23/10 — Checkpoint 3: persistência

**Exigência:** ao menos um fluxo de cadastro/consulta com persistência coerente com o projeto. A tabela aceita AsyncStorage, SQLite ou a solução definida pela arquitetura; não exige trocar AsyncStorage por banco remoto.

**Fluxo escolhido:** Perfil → Meus veículos. O aplicativo cadastra e lista veículos, mantém os dados em AsyncStorage e os carrega ao reabrir. Também persiste vagas, reservas e preferências.

**Demonstração no celular:**

1. Entre em “Entrar no modo demonstração” e abra **Perfil**.
2. Em **Meus veículos**, toque em **Adicionar veículo**.
3. Preencha “Onix azul”, placa fictícia “PEQ5A67”, tipo “Carro”, e salve.
4. Confira o item na lista. Feche o Expo Go e reabra o mesmo projeto, sem limpar os dados.
5. Volte ao Perfil e mostre que o veículo continua salvo.

**Onde explicar no código:** [interface](../src/screens/ProfileScreen.tsx), [ações e regras](../src/domain/model.ts), [fila de gravação](../src/state/AppProvider.tsx), [armazenamento versionado](../src/state/persistence.ts).

## 30/10 — Avaliação presencial 2: CRUD/persistência

**Exigência:** implementar/completar um CRUD; cada integrante executa e explica uma operação. O professor pode solicitar pequena alteração em sala.

O CRUD completo escolhido é o de **veículos**:

| Operação | Como mostrar | O que explicar |
| --- | --- | --- |
| Criar | Adicionar veículo e salvar | Validação de modelo/placa/tipo e ação `saveVehicle` |
| Consultar | Lista “Meus veículos” | Dados vêm do estado carregado pelo serviço de persistência |
| Atualizar | Ícone de edição; alterar para “Onix prata” | O mesmo ID é atualizado sem duplicar o registro |
| Excluir | Ícone de lixeira; confirmar “Excluir” | Ação `deleteVehicle`, gravação local e preservação do histórico de reservas |

Reabra o projeto após editar e excluir para mostrar que ambas as operações persistem. Tente salvar placa inválida e placa já cadastrada para demonstrar validações. As vagas possuem cadastro, consulta, edição e pausa; a pausa de vaga **não é apresentada como exclusão**.

**Sugestão de divisão para a apresentação:** Gabriel demonstra cadastro/consulta; Hirla demonstra edição/exclusão. Ambos devem conseguir explicar o caminho completo “formulário → validação → ação → persistência → tela”. A divisão é uma sugestão de ensaio, não uma declaração de atividades já realizadas.

**Pequena alteração para ensaio:** localizar e ajustar uma mensagem de validação, rodar tipagem/testes e demonstrar a mensagem. Não deixar alterações intencionais quebradas na entrega.

## 06/11 — Avaliação presencial 3: integração e depuração

**Exigência:** integrar partes do aplicativo, corrigir/melhorar comportamento, demonstrar tratamento de erros, depuração, conexão remota/API quando aplicável e domínio individual.

**Integração:** os cinco commits do fork da Hirla foram incorporados preservando a autoria e as atualizações de PSX14. As telas de login e cadastro usam Supabase Auth; a sessão aparece em “Conta de acesso” no Perfil. O CRUD de negócio continua local. Não é necessário inventar uma API própria para atender à tabela.

**Roteiro:**

1. Mostre a navegação da tela inicial para login e cadastro, além do acesso pelo Perfil.
2. Tente enviar campos vazios ou confirmação de senha diferente. Explique por que não ocorre requisição nesses casos.
3. Com uma conta de teste confirmada, entre e confira o e-mail em **Conta de acesso**; feche/reabra e depois saia da conta.
4. Mostre o erro com credenciais incorretas. Para demonstrar falta de conexão, abra primeiro o formulário, desligue a rede do celular, tente entrar e religue a rede antes de recarregar o projeto pelo Expo Go.
5. No modo proprietário, cadastre uma vaga com autorização; no motorista, localize essa vaga e faça uma reserva futura disponível. Volte ao proprietário e confira a mesma reserva. Essa integração usa o mesmo estado local no aparelho.
6. Abra o [relatório das correções](CORRECAO-AUTENTICACAO.md) e explique uma correção com seu teste: configuração ausente sem travar a abertura; senha vazia; erro de rede; restauração de sessão; CRUD persistido.

**Arquivos para estudar:** [login](../src/screens/LoginScrenn.tsx), [cadastro](../src/screens/CadastroScreen.tsx), [cliente Supabase](../src/lib/supabase.ts), [sessão](../src/state/AuthProvider.tsx), [testes de persistência](../src/state/persistence.test.ts).

## Testar no Expo Go do seu celular

1. Use Expo Go Android compatível com SDK 58.
2. No computador, abra a pasta do projeto que contém `package.json`.
3. Execute `npm.cmd ci`. Para autenticação real, preencha `.env` usando `.env.example`; nunca publique uma chave secret/service_role.
4. Execute `npm.cmd start`. Mantenha o terminal aberto e computador/celular na mesma rede Wi-Fi.
5. Leia o QR Code pelo Expo Go. Se houver dados antigos, isso é esperado: use um veículo fictício novo para a apresentação, sem apagar o histórico.

Antes de testar sem rede, aguarde o carregamento completo. A demonstração local funciona sem autenticação; login e cadastro reais precisam de internet. A confirmação de e-mail depende da configuração do projeto Supabase. Recuperação de senha ainda não está implementada no aplicativo.

## Evidências a registrar na apresentação

- Veículo criado visível depois de reabrir o projeto.
- Veículo editado e depois excluído, com nova reabertura após cada alteração.
- Mensagem de validação e uma falha de autenticação tratada.
- Sessão real confirmada e opção de saída.
- Cada integrante explicando sua operação e localizando o código correspondente.

Os testes automatizados usam armazenamento e respostas de autenticação simulados. Não substituem a conferência no celular. A validação visual e o login com conta confirmada da versão integrada devem ser marcados como realizados somente depois da execução real.
