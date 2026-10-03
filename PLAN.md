# Plano Garagem PE

## Referência e estado
O diretório começou vazio. A base Expo SDK 57 foi instalada diretamente aqui. O pedido detalhado foi recebido como pasted-text.txt. Em 09/09/2026 o usuário indicou `C:\Users\Gabs\Desktop\Organizar\Faculdade\Garagem Pe`, contendo `Garagem_PE_Formulario_e_Mockups.pdf` e os cinco PNGs `Garagem_PE_Mockup_1_Inicio.png` a `Garagem_PE_Mockup_5_Painel.png`. Todas as 7 páginas do PDF e as cinco imagens foram inspecionadas. Texto, renderes, hashes e auditoria estão em `work/references/`.

## Implementação

Publicação GitHub concluída (03/10/2026): repositório privado `https://github.com/PSX14/garagem-pe`, vinculado como `origin`, com `main` enviada e acompanhando `origin/main`. O primeiro commit `94b68e4` foi conferido pela API do GitHub e coincide com o local; 107 arquivos recebidos, sem `work/`, `node_modules/` ou `.expo/`. Identidade GitHub confirmada e e-mail noreply usados nos commits. A configuração de autenticação e transporte foi limitada a este repositório.

Preparação adicional solicitada após a entrega: perfil EAS `preview` para APK, distribuição interna, Node 24.19.0 e `EXPO_PUBLIC_MAP_MODE=local`; `.easignore` exclui temporários, entregáveis e arquivos de assinatura. O componente não monta Google Maps nesse perfil sem chave própria. Instruções PowerShell em `outputs/GERAR-APK.md`, com login Expo e raiz explícita via `EAS_PROJECT_ROOT`. A preparação local está concluída; gerar e instalar o APK depende da execução desses comandos na conta Expo do usuário. Isso não altera o fechamento anterior do objetivo Expo Go.

1. Ampliar domínio (src/domain): oito vagas, veículos, horários semanais, filtros, preço horário/diária, divisão 15/85, códigos únicos, avaliações e validações.
2. Persistência (src/state) versionada, migração da base inicial, recuperação sem perda silenciosa e restauração explícita.
3. Navegação nativa e apresentação (App.tsx, src/screens), alternância de modos e perfil demonstrativo.
4. Motorista: busca/lista/mapa, localização com alternativa manual, filtros persistidos, detalhes, reserva, confirmação, histórico e avaliação.
5. Proprietário: dashboard/ganhos, vagas, formulário completo com fotos copiadas localmente, disponibilidade e declaração obrigatória, reservas e avaliação.
6. Testes de domínio, storage, componentes e fluxos; checagens de compatibilidade e bundle Android.
7. Executar Expo Go no Android, inspecionar capturas das cinco telas principais e testar reinício; confrontar cada tela com as referências já recebidas, mantendo as funcionalidades adicionais do pedido textual.
8. README e relatório com resultados reais e limitações.

## Decisões
- Valores em centavos, comissão deduzida do total (15%) e líquido (85%), sem cobrança adicional ou transferência.
- O mockup 3 mostra taxa adicionada ao subtotal; esse exemplo conflita com a divisão explícita 15%/85% e não será copiado. A paleta hexadecimal do texto também prevalece sobre os tons ligeiramente diferentes dos PNGs.
- Context com ações transacionais: persistir antes de confirmar sucesso; uma única conta demonstrativa alterna papéis.
- Endereço aproximado antes da reserva, completo apenas no comprovante/local de edição do proprietário.
- React Native Maps com marcadores e lista funcional independente; localização e imagens via módulos Expo Go.
- Dados locais; nenhum serviço próprio. Mapa exige rede apenas para os tiles; reserva funciona offline.
- Fotos: até 5 em novos cadastros/edições, com compatibilidade de leitura para 6 fotos legadas v2, sem truncamento. Novos dados abrem no mapa, preservando a preferência que já estiver salva.
- Filtro Hoje significa possibilidade de entrada ainda hoje no fuso Recife, por 1h ou 24h na modalidade diária; saída pode ocorrer amanhã. A disponibilidade é verificada nos limites reais de abertura e liberação de reservas, sem arredondamento arbitrário.

## Implementado e auditado no código
- Domínio v2 com oito bairros demonstrativos, dois veículos, perfis motorista/proprietário, cinco reservas em quatro estados, filtros e distância haversine, preços por hora/diária, códigos GPE únicos e avaliações autorizadas.
- Serviço AsyncStorage central com gravação na primeira inicialização, validação do schema, migração v1 preservada, backup de corrupção e restauração explícita. O provider confirma as ações apenas após a gravação.
- Criação autorizada de vaga privada; pausa preserva reservas; alterações de capacidade, dias/horários e veículos aceitos não podem invalidar reservas futuras ou ativas. Cancelamento limitado ao motorista da reserva antes da entrada.
- Fluxos nativos motorista/proprietário, wizard de quatro etapas, galeria local, painel semanal e resumo mensal implementados. As cinco telas foram comparadas com capturas Android; parecer visual aprovado nas áreas examinadas, incluindo 360 dp e fonte 130%.

## Evidência de fechamento
- Instalação npm ci, check, TypeScript strict, lint sem warnings, 164 testes/10 suítes, compatibilidade, Expo Doctor 21/21 e bundle Android concluídos com saída 0 em 09/09/2026. `npm run verify`: 27,127 s. Logs e registros com horários em `outputs/verification/`.
- Expo Go 57.0.9 em Android 17 / API 37.1: busca/filtro, reserva e código, cancelamento, chegada/saída/avaliação, cadastro/edição/foto, ativação/pausa e conexão motorista/proprietário executados. Persistência após encerramento forçado observada, inclusive foto local após remover a cópia de seleção do emulador.
- Evidências, códigos e limitações registradas em `outputs/RELATORIO-VALIDACAO.md`; parecer de fidelidade em `outputs/REVISAO-VISUAL.md`. O mapa online apresentou falha de autorização no Expo Go; lista e mapa demonstrativo local funcionaram com os mesmos dados/filtros.
- Reabertura final após npm ci concluída: inicialização a frio da ExperienceActivity com Status ok, navegação do proprietário funcional e 4 reservas concluídas preservadas. Ganhos observados: R$ 92,00 bruto, R$ 13,80 comissão e R$ 78,20 líquido; captura `outputs/screenshots/21-reabertura-final-ganhos.png`. Não houve alteração das fontes já testadas.
- Foto local preservada na mesma reabertura final, mesmo sem a cópia de seleção do emulador: captura `outputs/screenshots/22-reabertura-final-foto.png`. Registro `outputs/verification/runtime-final.json` sem erros do aplicativo nos filtros de log examinados; mapa base Google mantém a limitação já documentada.
