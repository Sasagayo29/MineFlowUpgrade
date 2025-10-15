console.log("✅ script.js carregado - v2.0 com Melhorias");

// --- Elementos do DOM ---
const excelInput = document.getElementById("excel-input");
const sheetSelector = document.getElementById("sheet-selector");
const sheetIconBtn = document.getElementById("sheet-icon-btn");
const modalContainer = document.getElementById("modal-container");
const sessionModal = document.getElementById("session-modal");
const card = document.querySelector(".card");

// --- Variáveis de Estado Globais ---
let workbookData = null;
let steps = {};
let currentStep = null;
let historyStack = [];
let totalSteps = 0;
let userInputData = {}; // Para guardar os inputs do utilizador

// --- Inicialização ---
window.onload = () => {
    // Procura por uma sessão guardada quando a página carrega
    checkForSavedSession();
};

// --- Event Listeners ---
excelInput.addEventListener("change", handleFileUpload);
sheetIconBtn.addEventListener("click", () => {
    sheetSelector.classList.toggle("show");
});

document.addEventListener("click", (e) => {
    // Fecha o seletor de abas se clicar fora dele
    if (
        sheetSelector &&
        !sheetSelector.contains(e.target) &&
        !sheetIconBtn.contains(e.target)
    ) {
        sheetSelector.classList.remove("show");
    }
});

// --- Funções Principais do Fluxo ---

function handleFileUpload(e) {
    const fileNameSpan = document.getElementById("file-name");
    const file = e.target.files[0];
    if (!file) return;

    fileNameSpan.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            workbookData = {};
            workbook.SheetNames.forEach((name) => {
                const sheet = workbook.Sheets[name];
                workbookData[name] = XLSX.utils.sheet_to_json(sheet);
            });
            clearSession(); // Limpa a sessão antiga ao carregar um novo ficheiro
            populateSheetSelector(Object.keys(workbookData));
        } catch (error) {
            console.error("Erro ao ler o ficheiro Excel:", error);
            alert(
                "Ocorreu um erro ao ler o ficheiro. Verifique se o formato é válido."
            );
        }
    };
    reader.readAsArrayBuffer(file);
}

function populateSheetSelector(sheetNames) {
    sheetSelector.innerHTML = ""; // Limpa opções anteriores
    sheetNames.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        sheetSelector.appendChild(option);
    });

    sheetSelector.onchange = () => {
        clearSession();
        renderFlowFromSheet(sheetSelector.value);
    };
    renderFlowFromSheet(sheetNames[0]); // Renderiza a primeira aba por defeito
}

function renderFlowFromSheet(sheetName) {
    const rows = workbookData[sheetName];
    if (!rows || rows.length === 0) {
        alert("A aba selecionada está vazia ou não pôde ser lida.");
        return;
    }

    // Validação das colunas obrigatórias
    const requiredColumns = ["ID", "Título do Passo", "Descrição", "Tipo"];
    const fileColumns = Object.keys(rows[0]);
    const missingColumns = requiredColumns.filter(
        (col) => !fileColumns.includes(col)
    );

    if (missingColumns.length > 0) {
        alert(
            `Erro: O ficheiro Excel não contém as seguintes colunas obrigatórias na aba "${sheetName}":\n\n- ${missingColumns.join(
                "\n- "
            )}\n\nPor favor, corrija o ficheiro e tente novamente.`
        );
        excelInput.value = "";
        return;
    }

    // Processamento dos dados da planilha
    const newSteps = {};
    rows.forEach((row) => {
        const id = String(row["ID"] || "").trim();
        if (!id) return;

        newSteps[id] = {
            title: String(row["Título do Passo"] || "").trim(),
            description: String(row["Descrição"] || "").trim(),
            tipo: String(row["Tipo"] || "")
                .toLowerCase()
                .trim(),
            next: String(row["Próximo Direto"] || "").trim(),
            options: {
                sim: String(row["Próximo Sim"] || "").trim(),
                nao: String(row["Próximo Não"] || "").trim(),
            },
            emailData: (row["Email Para"] || "").trim()
                ? {
                      to: String(row["Email Para"] || "").trim(),
                      cc: String(row["Email CC"] || "").trim(),
                      assunto: String(row["Assunto Email"] || "").trim(),
                  }
                : null,
            prioridade: String(row["Prioridade"] || "").trim(),
            corPrioridade: String(row["Cor_Prioridade"] || "").trim(),
            imagem: String(row["Imagem"] || "").trim(),
            documentoAnexo: String(row["Documento_Anexo"] || "").trim(),
            checklist: String(row["Checklist"] || "").trim(),
            inputRequerido: String(row["Input_Requerido"] || "").trim(),
        };
    });

    const validationErrors = validateFlowData(newSteps);
    if (validationErrors.length > 0) {
        alert(
            "Foram encontrados erros de validação no fluxo:\n\n" +
                validationErrors.join("\n")
        );
        return;
    }

    steps = newSteps;
    totalSteps = Object.keys(steps).length;
    historyStack = [];
    userInputData = {};
    currentStep = Object.keys(steps)[0];
    renderStep(currentStep);
}

function renderStep(stepKey, fromNavigation = false) {
    if (!stepKey || !steps[stepKey]) return;

    if (!fromNavigation && currentStep !== stepKey) {
        historyStack.push(currentStep);
    }
    currentStep = stepKey;
    const step = steps[stepKey];
    const cardContent = document.querySelector(".card-content");

    cardContent.classList.add("fade-out");

    setTimeout(() => {
        cardContent.innerHTML = "";
        const oldNextBtn = document.querySelector(".next-icon");
        if (oldNextBtn) oldNextBtn.remove();

        // --- Renderização dos novos elementos ---
        updateProgressBar();
        updateBreadcrumbs();
        applyPriorityClass(step.corPrioridade);

        const titleEl = document.createElement("h2");
        titleEl.id = "step-title";
        titleEl.textContent = step.title;

        const descEl = document.createElement("p");
        descEl.id = "step-description";
        descEl.innerHTML = formatDescription(step.description);

        cardContent.appendChild(titleEl);
        cardContent.appendChild(descEl);

        if (step.imagem && step.imagem.startsWith("http")) {
            cardContent.appendChild(createImageElement(step.imagem));
        }
        if (step.documentoAnexo && step.documentoAnexo.startsWith("http")) {
            cardContent.appendChild(createDocumentLink(step.documentoAnexo));
        }
        if (step.checklist) {
            cardContent.appendChild(createChecklist(step.checklist));
        }
        if (step.inputRequerido) {
            cardContent.appendChild(createInputField(step.inputRequerido));
        }
        if (step.emailData) {
            cardContent.appendChild(createEmailForm(step));
        }

        const buttonsEl = document.createElement("div");
        buttonsEl.id = "buttons";
        cardContent.appendChild(buttonsEl);

        if (step.options && (step.options.sim || step.options.nao)) {
            if (step.options.sim)
                buttonsEl.appendChild(createNavButton(step.options.sim, "Sim"));
            if (step.options.nao)
                buttonsEl.appendChild(createNavButton(step.options.nao, "Não"));
        }

        if (step.next) {
            const nextBtn = createNavButton(
                step.next,
                `<i class="fa-solid fa-arrow-right"></i>`,
                "next-icon",
                "Próximo"
            );
            document.querySelector(".nav-buttons").appendChild(nextBtn);
        }

        updateFooter(step);
        checkFormCompletion();
        saveSession();

        cardContent.classList.remove("fade-out");
        cardContent.classList.add("fade-in");
    }, 200);
}

// --- Funções de Criação de Elementos ---

function createNavButton(nextStepId, text, className = "", title = "") {
    const btn = document.createElement("button");
    btn.innerHTML = text;
    if (className) btn.className = className;
    if (title) btn.title = title;
    btn.onclick = () => renderStep(nextStepId);
    return btn;
}

function createImageElement(url) {
    const imageContainer = document.createElement("div");
    imageContainer.id = "image-container";
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    imageContainer.appendChild(spinner);
    const img = new Image();
    img.src = url;
    img.onload = () => {
        spinner.remove();
        imageContainer.appendChild(img);
        img.style.display = "block";
    };
    img.onerror = () => {
        spinner.remove();
        imageContainer.innerHTML =
            '<p style="color:red;">Erro ao carregar a imagem.</p>';
    };
    return imageContainer;
}

function createDocumentLink(url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.className = "document-attachment-btn";
    link.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Consultar Documento`;
    return link;
}

function createChecklist(checklistData) {
    const container = document.createElement("div");
    container.className = "checklist-container";
    container.innerHTML = "<h4>Checklist de Verificação</h4>";
    const tasks = checklistData
        .split(";")
        .map((t) => t.trim())
        .filter((t) => t);
    tasks.forEach((task) => {
        const item = document.createElement("div");
        item.className = "checklist-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `chk-${task.replace(/\s+/g, "-")}`;
        checkbox.onchange = checkFormCompletion;
        const label = document.createElement("label");
        label.textContent = task;
        label.htmlFor = checkbox.id;
        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
    return container;
}

function createInputField(label) {
    const container = document.createElement("div");
    container.className = "input-container";
    container.innerHTML = `<h4>${label}</h4>`;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Inserir ${label}...`;
    input.onkeyup = () => {
        userInputData[currentStep] = {
            ...userInputData[currentStep],
            [label]: input.value,
        };
        checkFormCompletion();
    };
    container.appendChild(input);
    return container;
}

function createEmailForm(step) {
    const emailForm = document.createElement("div");
    emailForm.className = "email-form";
    emailForm.innerHTML = `
        <label for="email-message">Mensagem:</label>
        <textarea id="email-message" placeholder="Descreva o ocorrido..." rows="4"></textarea>
        <button type="button" id="send-email-btn">Enviar Email</button>
    `;

    emailForm.querySelector("#send-email-btn").onclick = () => {
        const message = emailForm.querySelector("#email-message").value.trim();
        if (!message) {
            alert("Por favor, digite uma mensagem antes de enviar.");
            return;
        }
        const mailtoLink = `mailto:${step.emailData.to}?cc=${encodeURIComponent(
            step.emailData.cc || ""
        )}&subject=${encodeURIComponent(
            step.emailData.assunto || ""
        )}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;
    };

    return emailForm;
}

// --- Funções Auxiliares e de UI ---

function formatDescription(description) {
    if (
        description.includes("•") ||
        description.includes("*") ||
        description.includes("-")
    ) {
        return (
            "<ul>" +
            description
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map(
                    (line) => `<li>${line.replace(/[•*-]\s*/, "").trim()}</li>`
                )
                .join("") +
            "</ul>"
        );
    }
    return description.replace(/\n/g, "<br>");
}

function checkFormCompletion() {
    const allCheckboxes = document.querySelectorAll(
        '.checklist-item input[type="checkbox"]'
    );
    const allInputs = document.querySelectorAll(
        '.input-container input[type="text"]'
    );

    const allChecked = [...allCheckboxes].every((chk) => chk.checked);
    const allFilled = [...allInputs].every((inp) => inp.value.trim() !== "");

    const isComplete = allChecked && allFilled;

    document
        .querySelectorAll("#buttons button, .nav-buttons .next-icon")
        .forEach((btn) => {
            btn.disabled = !isComplete;
        });
}

function updateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    if (!progressBar) return;
    const progress =
        totalSteps > 0 ? ((historyStack.length + 1) / totalSteps) * 100 : 0;
    progressBar.style.width = `${progress}%`;
}

function updateBreadcrumbs() {
    const breadcrumbsContainer = document.getElementById(
        "breadcrumbs-container"
    );
    if (!breadcrumbsContainer) return;
    breadcrumbsContainer.innerHTML = "";
    const path = [...historyStack, currentStep];

    path.forEach((stepId, index) => {
        if (!steps[stepId]) return;
        const stepTitle = steps[stepId].title;
        const crumb = document.createElement("span");
        crumb.className = "breadcrumb-item";
        crumb.textContent = stepTitle;

        if (index < path.length - 1) {
            crumb.onclick = () => {
                const stepsToPop = historyStack.length - index;
                for (let i = 0; i < stepsToPop; i++) historyStack.pop();
                renderStep(stepId, true);
            };
            breadcrumbsContainer.appendChild(crumb);
            breadcrumbsContainer.append(" > ");
        } else {
            breadcrumbsContainer.appendChild(crumb);
        }
    });
}

function applyPriorityClass(color) {
    card.classList.remove(
        "prioridade-vermelho",
        "prioridade-laranja",
        "prioridade-azul",
        "prioridade-verde"
    );
    if (color) {
        card.classList.add(`prioridade-${color.toLowerCase()}`);
    }
}

// --- Funções de Navegação e do Rodapé ---

function updateFooter(step) {
    const backBtn = document.getElementById("back-button");
    const resetBtn = document.getElementById("reset-button");
    const flowSummarySection = document.getElementById("flow-summary");
    const viewFlowBtn = document.getElementById("view-flow-btn");

    backBtn.disabled = historyStack.length === 0;

    if (!step.next && !step.options.sim && !step.options.nao) {
        flowSummarySection.style.display = "block";
        viewFlowBtn.style.display = "inline-block";
    } else {
        flowSummarySection.style.display = "none";
        viewFlowBtn.style.display = "none";
    }

    backBtn.onclick = goBack;
    resetBtn.onclick = resetFlow;
    viewFlowBtn.onclick = showMermaidFlow;
}

function goBack() {
    if (historyStack.length > 0) {
        renderStep(historyStack.pop(), true);
    }
}

function resetFlow() {
    clearSession();
    historyStack = [];
    userInputData = {};
    if (steps && Object.keys(steps).length > 0) {
        renderStep(Object.keys(steps)[0]);
    }
}

// --- Lógica de Sessão ---

function saveSession() {
    if (!workbookData) return;
    const session = {
        workbookData,
        steps,
        currentStep,
        historyStack,
        totalSteps,
        userInputData,
        sheetName: sheetSelector.value,
        fileName: document.getElementById("file-name").textContent,
    };
    localStorage.setItem("mineflow_session", JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem("mineflow_session");
}

function checkForSavedSession() {
    const savedSession = localStorage.getItem("mineflow_session");
    if (savedSession) {
        sessionModal.style.display = "flex";
        document.getElementById("session-continue-btn").onclick = () => {
            loadSession(JSON.parse(savedSession));
            sessionModal.style.display = "none";
        };
        document.getElementById("session-discard-btn").onclick = () => {
            clearSession();
            sessionModal.style.display = "none";
        };
    }
}

function loadSession(session) {
    workbookData = session.workbookData;
    steps = session.steps;
    currentStep = session.currentStep;
    historyStack = session.historyStack;
    totalSteps = session.totalSteps;
    userInputData = session.userInputData;

    populateSheetSelector(Object.keys(workbookData));
    sheetSelector.value = session.sheetName;
    document.getElementById("file-name").textContent = session.fileName;

    renderStep(currentStep, true);
}

// --- Validação Avançada do Excel ---

function validateFlowData(stepsData) {
    const errors = [];
    const ids = new Set(Object.keys(stepsData));
    for (const id in stepsData) {
        const step = stepsData[id];
        const checkLink = (link, type) => {
            if (link && !ids.has(link)) {
                errors.push(
                    `- Passo "${id}" (${step.title}): O link para "${type}" aponta para um ID inexistente: "${link}"`
                );
            }
        };
        checkLink(step.next, "Próximo Direto");
        if (step.options) {
            checkLink(step.options.sim, "Próximo Sim");
            checkLink(step.options.nao, "Próximo Não");
        }
    }
    return errors;
}

// --- Lógica do Modal do Fluxograma e PDF ---

function getMermaidGraph() {
    const direction = window.innerWidth <= 768 ? "TB" : "LR";
    let links = [];

    // Função para higienizar o texto para o Mermaid
    const sanitize = (text) => {
        if (!text) return "";
        // Substitui aspas por uma entidade HTML que o Mermaid entende
        return text.replace(/"/g, "&quot;");
    };

    for (const [id, step] of Object.entries(steps)) {
        const from = id.replace(/\W/g, "_");
        const title = sanitize(step.title);

        if (step.options && (step.options.sim || step.options.nao)) {
            if (step.options.sim)
                links.push(
                    `${from}{"${title}"} -->|Sim| ${step.options.sim.replace(
                        /\W/g,
                        "_"
                    )}`
                );
            if (step.options.nao)
                links.push(
                    `${from}{"${title}"} -->|Não| ${step.options.nao.replace(
                        /\W/g,
                        "_"
                    )}`
                );
        } else if (step.next) {
            links.push(
                `${from}["${title}"] --> ${step.next.replace(/\W/g, "_")}`
            );
        } else {
            // Nó final
            links.push(`${from}["${title}"]`);
        }
    }
    return `flowchart ${direction}\n${links.join("\n")}`;
}

async function showMermaidFlow() {
    try {
        const graphDefinition = getMermaidGraph();
        const { svg } = await mermaid.render("mermaid-graph", graphDefinition);

        modalContainer.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Fluxo de Decisão</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    ${svg}
                </div>
                <div class="modal-footer">
                    <div class="modal-actions">
                        <button id="show-desc-btn">Ver Descrições</button>
                        <button id="export-pdf-btn">Exportar PDF</button>
                    </div>
                </div>
            </div>
        `;

        modalContainer.classList.add("visible");

        modalContainer.querySelector(".modal-close-btn").onclick = closeModal;
        modalContainer.querySelector("#show-desc-btn").onclick = () =>
            createDescriptionsPopup(steps);
        modalContainer.querySelector("#export-pdf-btn").onclick = () =>
            exportFlowToPDF(steps);
        modalContainer.onclick = (e) => {
            if (e.target === modalContainer) closeModal();
        };
    } catch (err) {
        console.error("Erro ao gerar o fluxo:", err);
        alert("Erro ao gerar o fluxo: " + err.message);
    }
}

function closeModal() {
    modalContainer.classList.remove("visible");
    setTimeout(() => {
        modalContainer.innerHTML = "";
    }, 300);
}

function createDescriptionsPopup(stepsData) {
    const overlay = document.createElement("div");
    overlay.className = "descriptions-popup-overlay";

    let stepsHtml = "";
    for (const key in stepsData) {
        const step = stepsData[key];
        stepsHtml += `
            <div class="step-item">
                <h4>${step.title}</h4>
                <p>${step.description.replace(/\n/g, "<br>")}</p>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="descriptions-popup-content">
            <h3>Descrições dos Passos</h3>
            ${stepsHtml}
        </div>
    `;

    modalContainer.querySelector(".modal-content").appendChild(overlay);
    overlay.onclick = () => overlay.remove();
}

function getImageAsBase64(url) {
    // Usa um proxy para evitar problemas de CORS. Note que 'cors-anywhere' é um serviço público.
    // Para produção, o ideal é ter o seu próprio proxy.
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    return fetch(proxyUrl + url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `A resposta da rede não foi bem-sucedida para a URL: ${url}`
                );
            }
            return response.blob();
        })
        .then(
            (blob) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
        )
        .catch((error) => {
            console.error(`Falha ao buscar a imagem: ${url}`, error);
            return null;
        });
}

async function exportFlowToPDF(stepsData) {
    alert(
        "A iniciar a geração do PDF. O carregamento das imagens pode demorar alguns segundos..."
    );
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "pt", "a4");

        const imageMap = {};
        const imagePromises = [];
        const imageUrls = [
            ...new Set(
                Object.values(stepsData)
                    .map((step) => step.imagem)
                    .filter((img) => img && img.startsWith("http"))
            ),
        ];

        imageUrls.forEach((url) => {
            imagePromises.push(
                getImageAsBase64(url).then((base64) => {
                    if (base64) {
                        imageMap[url] = base64;
                    }
                })
            );
        });

        await Promise.all(imagePromises);

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 40;
        let yPosition = margin;

        const checkAddPage = (spaceNeeded) => {
            if (
                yPosition + spaceNeeded >
                pdf.internal.pageSize.getHeight() - margin
            ) {
                pdf.addPage();
                yPosition = margin;
            }
        };

        const flowElement = modalContainer.querySelector(".modal-body");
        const canvas = await html2canvas(flowElement, { scale: 2 });
        const diagramData = canvas.toDataURL("image/png");
        const diagramProps = pdf.getImageProperties(diagramData);
        const diagramHeight =
            (diagramProps.height * (pdfWidth - margin * 2)) /
            diagramProps.width;

        pdf.setFontSize(20);
        pdf.text("Fluxo de Decisão", pdfWidth / 2, yPosition, {
            align: "center",
        });
        yPosition += 30;
        checkAddPage(diagramHeight);
        pdf.addImage(
            diagramData,
            "PNG",
            margin,
            yPosition,
            pdfWidth - margin * 2,
            diagramHeight
        );

        pdf.addPage();
        yPosition = margin;

        pdf.setFontSize(16);
        pdf.text("Descrições dos Passos", margin, yPosition);
        yPosition += 30;

        for (const key in stepsData) {
            const step = stepsData[key];

            checkAddPage(40);

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(step.title, margin, yPosition);
            yPosition += 15;

            pdf.setFont("helvetica", "normal");
            const splitDesc = pdf.splitTextToSize(
                step.description,
                pdfWidth - margin * 2
            );
            checkAddPage(splitDesc.length * 12);
            pdf.text(splitDesc, margin, yPosition);
            yPosition += splitDesc.length * 12 + 10;

            if (step.imagem && imageMap[step.imagem]) {
                const imgBase64 = imageMap[step.imagem];
                const imgProps = pdf.getImageProperties(imgBase64);
                const imgWidth = pdfWidth - margin * 2;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                checkAddPage(imgHeight + 20);
                pdf.addImage(
                    imgBase64,
                    "PNG",
                    margin,
                    yPosition,
                    imgWidth,
                    imgHeight
                );
                yPosition += imgHeight + 20;
            } else if (step.imagem) {
                checkAddPage(20);
                pdf.setFont("helvetica", "italic");
                pdf.setTextColor(150);
                pdf.text("[Erro ao carregar imagem]", margin, yPosition);
                pdf.setTextColor(0);
                yPosition += 20;
            }
            yPosition += 10;
        }

        pdf.save(`fluxo_decisao_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar PDF: " + error.message);
    }
}
