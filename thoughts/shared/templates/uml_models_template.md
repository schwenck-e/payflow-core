# 📐 Modelagem Estrutural & Comportamental (UML 2.5)

**Projeto:** [Nome do Projeto]  
**Referência SRS:** [thoughts/shared/requirements/YYYY-MM-DD-srs-specification.md]  
**Analista de Sistemas:** [Systems Analyst Agent]  
**Data:** [YYYY-MM-DD]  
**Versão:** 1.0.0  

---

## 🏗️ 1. Diagrama de Classes UML (Modelo Estrutural de Domínio)

```mermaid
classDiagram
    direction TB

    class Usuario {
        -String id
        -String nome
        -String email
        -String senhaHash
        -PerfilUsuario perfil
        -DateTime criadoEm
        +autenticar(senha: String): Boolean
        +temPermissao(permissao: String): Boolean
    }

    class PerfilUsuario {
        <<enumeration>>
        ADMIN
        COORDENADOR
        TECNICO
        ATENDENTE
    }

    class Tecnico {
        -String especialidade
        -String telefone
        -Boolean disponivel
        +atribuirOrdem(ordemId: String): Void
        +liberarDisponibilidade(): Void
    }

    class Cliente {
        -String id
        -String nome
        -String documento
        -String email
        -String telefone
        -String endereco
        -StatusFinanceiro statusFinanceiro
        +isInadimplente(): Boolean
        +bloquear(): Void
    }

    class StatusFinanceiro {
        <<enumeration>>
        REGULAR
        INADIMPLENTE
        BLOQUEADO
    }

    class OrdemServico {
        -String id
        -String numeroOS
        -String descricao
        -PrioridadeOS prioridade
        -StatusOS status
        -DateTime abertaEm
        -DateTime? concluidaEm
        -String? laudoTecnico
        -String? assinaturaBase64
        -Decimal valorTotal
        +atribuirTecnico(tecnico: Tecnico): Void
        +adicionarItem(peca: Peca, qtd: Integer): ItemOrdem
        +concluir(laudo: String, assinatura: String): Void
        +cancelar(motivo: String): Void
        -calcularTotal(): Decimal
    }

    class StatusOS {
        <<enumeration>>
        ABERTA
        EM_ANDAMENTO
        CONCLUIDA
        CANCELADA
    }

    class PrioridadeOS {
        <<enumeration>>
        BAIXA
        MEDIA
        ALTA
        URGENTE
    }

    class ItemOrdem {
        -String id
        -Integer quantidade
        -Decimal valorUnitario
        -Decimal subtotal
        +calcularSubtotal(): Decimal
    }

    class Peca {
        -String id
        -String codigoSKU
        -String nome
        -Decimal precoVenda
        -Integer estoqueAtual
        +baixarEstoque(qtd: Integer): Void
        +estornarEstoque(qtd: Integer): Void
    }

    Usuario <|-- Tecnico: Herança
    Usuario --> PerfilUsuario: possui
    Cliente --> StatusFinanceiro: possui
    OrdemServico "0..*" --> "1" Cliente: solicitada por
    OrdemServico "0..*" --> "0..1" Tecnico: executada por
    OrdemServico --> StatusOS: estado
    OrdemServico --> PrioridadeOS: prioridade
    OrdemServico "1" *-- "0..*" ItemOrdem: composição (itens pertencem à OS)
    ItemOrdem "0..*" --> "1" Peca: refere-se a
```

---

## 🔄 2. Diagrama de Máquinas de Estado (Statechart do Ciclo de Vida da OS)

```mermaid
stateDiagram-v2
    [*] --> ABERTA: Criar OS [Cliente Regular ou Aprovado]

    ABERTA --> EM_ANDAMENTO: Atribuir Técnico [Técnico Disponível]
    ABERTA --> CANCELADA: Cancelar [Sem Custos Faturados]

    EM_ANDAMENTO --> CONCLUIDA: Concluir [Laudo >= 20 chars E Assinatura Presente]
    EM_ANDAMENTO --> CANCELADA: Cancelar [Estorna Peças em Transação Atômica]
    EM_ANDAMENTO --> ABERTA: Desatribuir Técnico [Libera Técnico]

    CONCLUIDA --> [*]: Trava Imutável (Somente-Leitura)
    CANCELADA --> [*]: Registro Arquivado
```

---

## ⚡ 3. Diagrama de Sequência de Sistema (SSD — Conclusão de OS)

```mermaid
sequenceDiagram
    autonumber
    actor T as 👤 Técnico de Campo
    participant UI as 📱 App Web / Mobile
    participant API as 🌐 Fastify API Controller
    participant Svc as ⚙️ WorkOrderService
    participant Repo as 🗄️ WorkOrderRepository
    participant DB as 💾 Database Transacional
    participant Mail as 📬 Email Service

    T->>UI: Preenche laudo conclusivo e coleta assinatura do cliente
    T->>UI: Clica em [Confirmar e Encerrar OS]
    
    UI->>API: POST /api/v1/orders/{id}/complete {laudo, assinatura}
    API->>Svc: completeOrder(orderId, laudo, assinatura, userContext)
    
    Svc->>Repo: findById(orderId)
    Repo->>DB: SELECT * FROM orders WHERE id = ?
    DB-->>Repo: Order Entity
    Repo-->>Svc: Order Entity
    
    alt Status != EM_ANDAMENTO
        Svc-->>API: Error 400 Bad Request ("OS não está em andamento")
        API-->>UI: Exibe alerta de estado inválido
    else Laudo < 20 caracteres OU Assinatura Vazia (RN-001)
        Svc-->>API: Error 422 Unprocessable Entity ("RN-001: Laudo e assinatura obrigatórios")
        API-->>UI: Destaca campos pendentes na tela
    else Validações Aprovadas
        Svc->>Svc: order.concluir(laudo, assinatura)
        Svc->>Repo: saveTransaction(order, items)
        Repo->>DB: BEGIN TRANSACTION; UPDATE orders SET status='CONCLUIDA'...; COMMIT;
        DB-->>Repo: Success
        Repo-->>Svc: Persisted Order
        
        Svc->>Mail: sendOrderReceiptAsync(order.id, client.email)
        Mail-->>Svc: Enqueued
        
        Svc-->>API: Order Completed DTO
        API-->>UI: HTTP 200 OK {orderId, status: "CONCLUIDA", receiptUrl}
        UI-->>T: Exibe toast de sucesso e comprovante em PDF
    end
```
