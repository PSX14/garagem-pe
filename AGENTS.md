# Garagem PE

- Aplicativo acadêmico exclusivamente React Native, Expo e TypeScript strict; componentes nativos e StyleSheet.
- Não criar web, HTML/CSS, React DOM, backend, autenticação real, banco remoto ou pagamentos reais.
- Fontes de requisitos: texto anexado em 04/09/2026 e referências localizadas em `C:\Users\Gabs\Desktop\Organizar\Faculdade\Garagem Pe`: `Garagem_PE_Formulario_e_Mockups.pdf` e cinco PNGs `Garagem_PE_Mockup_1_Inicio.png` a `Garagem_PE_Mockup_5_Painel.png`. PDF de 7 páginas e cinco imagens inspecionados em 09/09/2026; auditoria e renderes em `work/references/`. Só alegar fidelidade final após comparar capturas reais Android com essas fontes.
- npm e package-lock.json. Usar versões compatíveis com Expo Go Android.
- Persistir estado versionado em AsyncStorage por serviço central. Imagens locais pelo Expo FileSystem.
- Dinheiro em centavos. Comissão de 15% incluída no total anunciado e repasse de 85%, sem adicionar taxa ao preço. O mockup 3 soma taxa por fora; prevalece a regra explícita do pedido textual. Nunca solicitar dados bancários/CPF/chaves Pix.
- Novos cadastros/edições aceitam até 5 fotos locais, conforme mockup 4. Preservar até 6 fotos de estados v2 anteriores no carregamento, exigindo redução antes de nova edição; não truncar nem apagar dados silenciosamente.
- Privacidade: endereço completo e instruções apenas após confirmação; dados de demonstração fictícios.
- Negócio em funções tipadas e testáveis; validar duração, datas, conflitos, disponibilidade e autorização de vaga privada.
- Tema: azul #0B1F3A, laranja #FF9F1C, confirmação #22A06B, fundo #F5F7FA, texto #172033.
- SafeArea, teclado, rolagem, estados e acessibilidade; confirmar ações destrutivas.
- Verificações: npm ci; npm run typecheck; npm run lint; npm test -- --runInBand; npx expo-doctor; npx expo export --platform android.
- Não marcar concluído sem execução Expo Go Android, persistência após reinício e evidência dos fluxos e referências visuais.
- Manter PLAN.md e PROGRESS.md atualizados. Artefatos entregáveis em outputs/; temporários em work/.
