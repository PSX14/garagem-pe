Warning: truncated output (original token count: 2261)
Total output lines: 39

# Progresso

03/10/2026 — Checkpoint 1 preparado em `outputs/checkpoint-1/Garagem-PE-Checkpoint-1.pdf`, com duas páginas e os sete itens do enunciado. Nomes e divisão das tarefas preservados do documento Word fornecido. Link do repositório público conferido e incluído como hiperlink. Rascunho de e-mail salvo separadamente; nenhum envio ao professor, à plataforma ou ao GitHub realizado nesta etapa. Original Word preservado.

03/10/2026 — Publicação concluída em `https://github.com/PSX14/garagem-pe` (privado). Primeiro commit `94b68e4` enviado para `main`, com acompanhamento de `origin/main`; SHA local e remoto iguais e 107 arquivos confirmados pela API GitHub. Caches, dependências instaladas e autenticação local ficaram excluídos. Transporte Git ajustado apenas neste repositório para OpenSSL/HTTP 1.1, mantendo a verificação TLS, após falha do Schannel e uma tentativa de envio interrompida. Nenhuma alteração funcional no aplicativo.

03/10/2026 — Git inicializado em `main`; 107 arquivos preparados para o primeiro commit. `.gitignore` ampliado para excluir credenciais, arquivos de assinatura e configurações locais. A revisão dos arquivos preparados não encontrou padrões de credenciais nem arquivos acima de 50 MB. Login GitHub autorizado pelo usuário na conta PSX14 e repositório privado criado em `https://github.com/PSX14/garagem-pe`, vinculado como `origin`. GitHub CLI e autenticação local ficam somente em `work/`, excluído do Git. Identidade de commit configurada apenas neste repositório, com e-mail noreply da conta confirmada. Nenhum código do aplicativo alterado nesta preparação.

Atualizado em 09/09/2026.

Preparação posterior para APK: `eas.json`, `.easignore` e `outputs/GERAR-APK.md` adicionados. Perfil preview usa mapa local imediatamente, preservando o modo Expo Go. Quatro testes do mapa, typecheck, lint e 239 verificações estruturais aprovados; bundle com `EXPO_PUBLIC_MAP_MODE=local` exportado em `work/apk-p…1261 tokens truncated…ão do usuário: 'Abriu a tela inicial' no Expo Go pelo túnel oficial. Evidência técnica local atualizada com phoneOpened=true e origem da confirmação. Não confundir abertura com validação completa: fluxos de motorista/proprietário e persistência após reinício continuam sem nova confirmação.

10/11/2026 — Uso de Supabase remoto explicitamente autorizado. Projeto independente `garagem-pe-psx14` conferido como ativo; tabelas RLS para perfil, estado, veículos, vagas, reservas, favoritos e avaliações criadas. A função de evento exposta `rls_auto_enable` e o gatilho associado foram removidos. O estado local versionado passa a ser sincronizado por conta autenticada sem bloquear ações offline. Falta validar no Expo Go com uma conta criada neste projeto e resolver o único alerta de configuração (proteção contra senhas vazadas desativada no painel Auth).

10/11/2026 — React e react-test-renderer foram alinhados em 19.3.0; correções de tipo nos testes e no gráfico de ganhos aprovadas. TypeScript strict e ESLint passaram. Testes por grupos aprovados: 121 de domínio/estado/serviços/UI, 26 de proprietário, 18 de motorista e telas de acesso. Bundle Android gerado em `outputs/android-bundle` com o TEMP redirecionado a `work/tmp`; a tentativa sem esse redirecionamento falhou apenas por permissão de escrita da pasta temporária isolada. Expo Doctor ficou em 18/20 porque a rede não resolveu `exp.host` durante duas consultas online.

10/11/2026 — Auditoria remota posterior: as sete tabelas públicas mantêm RLS ativo. Políticas duplicadas herdadas de `profiles` foram removidas, políticas de vagas foram separadas por operação e índices das chaves estrangeiras adicionados. O verificador não aponta vulnerabilidades de tabela; resta somente o aviso de configuração de Auth para proteção contra senhas vazadas. Há uma cópia versionada em `app_states`, criada pela conta usada no Expo Go, comprovando sincronização remota inicial.

