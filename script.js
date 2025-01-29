document.addEventListener("DOMContentLoaded", carregarAssistidos);

function cadastrarAssistido() {
    let nome = document.getElementById("nome").value;
    let telefone = document.getElementById("telefone").value;

    if (nome.trim() === "" || telefone.trim() === "") {
        alert("Preencha todos os campos!");
        return;
    }

    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    assistidos.push({ nome, telefone });
    localStorage.setItem("assistidos", JSON.stringify(assistidos));

    document.getElementById("nome").value = "";
    document.getElementById("telefone").value = "";

    carregarAssistidos();
}

function carregarAssistidos() {
    let lista = document.getElementById("listaAssistidos");
    lista.innerHTML = "";

    db.ref("assistidos").once("value", snapshot => {
        snapshot.forEach(childSnapshot => {
            let assistido = childSnapshot.val();
            let assistidoId = childSnapshot.key;

            let corStatus = {
                "pendente": "red",
                "documentos enviados": "blue",
                "não respondeu": "orange",
                "concluído": "green"
            }[assistido.status] || "black";

            let responsavelTexto = assistido.responsavel ? `👤 ${assistido.responsavel}` : "⚠ Sem responsável";

            let li = document.createElement("li");
            li.innerHTML = `
                <span style="color:${corStatus}">[${assistido.status}]</span> 
                ${assistido.nome} - <a href="https://wa.me/55${assistido.telefone}" target="_blank">${assistido.telefone}</a> 
                <br><small>${responsavelTexto}</small>
                <br><button onclick="abrirAnotacoes('${assistidoId}')">📝 Ver Anotações</button>
                <button onclick="removerAssistido('${assistidoId}')">❌</button>
            `;
            lista.appendChild(li);
        });
    });
}

function removerAssistido(assistidoId) {
    if (confirm("Tem certeza que deseja excluir este assistido?")) {
        db.ref("assistidos/" + assistidoId).remove().then(() => {
            alert("Assistido removido!");
            carregarAssistidos();
        }).catch(error => {
            alert("Erro ao remover: " + error.message);
        });
    }
}

function buscarAssistido() {
    let termo = document.getElementById("buscar").value.toLowerCase();
    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    let lista = document.getElementById("listaAssistidos");
    lista.innerHTML = "";

    assistidos
        .filter(a => a.nome.toLowerCase().includes(termo))
        .forEach((assistido, index) => {
            let li = document.createElement("li");
            li.innerHTML = `
                ${assistido.nome} - <a href="https://wa.me/55${assistido.telefone}" target="_blank">${assistido.telefone}</a> 
                <button onclick="removerAssistido(${index})">❌</button>
            `;
            lista.appendChild(li);
        });
}

let assistidoSelecionado = null;

function abrirAnotacoes(index) {
    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    assistidoSelecionado = index;

    let assistido = assistidos[index];
    document.getElementById("assistidoNome").innerText = assistido.nome;
    document.getElementById("status").value = assistido.status || "pendente";
    document.getElementById("anotacoesContainer").style.display = "block";

    carregarAnotacoes();
}

function fecharAnotacoes() {
    document.getElementById("anotacoesContainer").style.display = "none";
}

function carregarAnotacoes() {
    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    let assistido = assistidos[assistidoSelecionado];

    let lista = document.getElementById("listaAnotacoes");
    lista.innerHTML = "";

    if (!assistido.anotacoes) assistido.anotacoes = [];

    assistido.anotacoes.forEach((anotacao, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${anotacao} <button onclick="removerAnotacao(${index})">❌</button>`;
        lista.appendChild(li);
    });

    localStorage.setItem("assistidos", JSON.stringify(assistidos));
}

function salvarAnotacao() {
    let assistidoId = assistidoSelecionado;
    let novaAnotacao = document.getElementById("novaAnotacao").value.trim();
    let usuarioLogado = localStorage.getItem("usuarioLogado");

    if (novaAnotacao === "") {
        alert("Digite uma anotação válida!");
        return;
    }

    let dataHora = new Date().toLocaleString();
    let anotacaoFinal = `${dataHora} - ${usuarioLogado}: ${novaAnotacao}`;

    let ref = db.ref("assistidos/" + assistidoId + "/anotacoes").push();
    ref.set(anotacaoFinal, function(error) {
        if (error) {
            alert("Erro ao salvar anotação!");
        } else {
            document.getElementById("novaAnotacao").value = "";
            carregarAnotacoes(assistidoId);
        }
    });
}

function exportarDados() {
    let assistidos = localStorage.getItem("assistidos");

    if (!assistidos) {
        alert("Nenhum dado para exportar!");
        return;
    }

    let blob = new Blob([assistidos], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "assistidos_backup.json";
    link.click();
}

function importarDados() {
    let arquivo = document.getElementById("importarArquivo").files[0];

    if (!arquivo) {
        alert("Selecione um arquivo JSON para importar!");
        return;
    }

    let reader = new FileReader();
    reader.onload = function(event) {
        try {
            let dados = JSON.parse(event.target.result);
            localStorage.setItem("assistidos", JSON.stringify(dados));
            carregarAssistidos();
            alert("Dados importados com sucesso!");
        } catch (e) {
            alert("Erro ao importar o arquivo! Verifique o formato.");
        }
    };
    reader.readAsText(arquivo);
}

function baixarBackup() {
    let assistidos = localStorage.getItem("assistidos");

    if (!assistidos) {
        alert("Nenhum dado para salvar!");
        return;
    }

    let data = new Date().toISOString().slice(0, 10);
    let blob = new Blob([assistidos], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${data}.json`;
    link.click();
}

function removerAnotacao(index) {
    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    let assistido = assistidos[assistidoSelecionado];

    assistido.anotacoes.splice(index, 1);

    localStorage.setItem("assistidos", JSON.stringify(assistidos));
    carregarAnotacoes();
}

function atualizarResponsavel() {
    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    let assistido = assistidos[assistidoSelecionado];

    assistido.responsavel = document.getElementById("responsavel").value;

    localStorage.setItem("assistidos", JSON.stringify(assistidos));
    carregarAssistidos();
}

function atualizarStatus() {
    let assistidos = JSON.parse(localStorage.getItem("assistidos")) || [];
    let assistido = assistidos[assistidoSelecionado];

    assistido.status = document.getElementById("status").value;

    localStorage.setItem("assistidos", JSON.stringify(assistidos));
    carregarAssistidos();
}

let usuarios = [
    { usuario: "hendryckramos", senha: "brazramos11" },
    { usuario: "nathan", senha: "123456" },
    { usuario: "tiago", senha: "123456" }
];

function salvarAssistido() {
    let nome = document.getElementById("nome").value.trim();
    let telefone = document.getElementById("telefone").value.trim();

    if (nome === "" || telefone === "") {
        alert("Preencha todos os campos!");
        return;
    }

    let novoAssistido = {
        nome: nome,
        telefone: telefone,
        status: "pendente",
        responsavel: "",
        anotacoes: []
    };

    let ref = db.ref("assistidos").push();
    ref.set(novoAssistido, function(error) {
        if (error) {
            alert("Erro ao salvar no banco de dados!");
        } else {
            alert("Assistido cadastrado com sucesso!");
            document.getElementById("nome").value = "";
            document.getElementById("telefone").value = "";
            carregarAssistidos();
        }
    });
}

function login() {
    let user = document.getElementById("usuario").value;
    let pass = document.getElementById("senha").value;

    let usuarioValido = usuarios.find(u => u.usuario === user && u.senha === pass);

    if (usuarioValido) {
        localStorage.setItem("usuarioLogado", user);
        carregarDashboard();
    } else {
        alert("Usuário ou senha inválidos!");
    }
}

function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.reload();
}

function carregarDashboard() {
    let usuarioLogado = localStorage.getItem("usuarioLogado");
    if (!usuarioLogado) {
        document.getElementById("loginContainer").style.display = "block";
        document.getElementById("dashboardContainer").style.display = "none";
    } else {
        document.getElementById("usuarioLogado").innerText = usuarioLogado;
        document.getElementById("loginContainer").style.display = "none";
        document.getElementById("dashboardContainer").style.display = "block";
        carregarAssistidos();
    }
}

window.onload = carregarDashboard;
