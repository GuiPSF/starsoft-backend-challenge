
# 🎬 Cinema Ticket Reservation System

## 1. Visão Geral

Este projeto implementa um sistema de reserva e venda de ingressos de cinema projetado para lidar com **alta concorrência**, **múltiplas instâncias da aplicação** e **consistência forte dos dados**.

O sistema garante que:
- Um assento **nunca seja vendido duas vezes**
- Reservas sejam **temporárias (30 segundos)** e expirem automaticamente
- Pagamentos confirmados convertam reservas em **vendas definitivas**
- Eventos de domínio sejam publicados e consumidos de forma confiável

A solução foi pensada com foco em **robustez**, **escalabilidade horizontal** e **boas práticas de arquitetura backend**.

---

## 2. Tecnologias Escolhidas

### Banco de Dados — PostgreSQL
- Consistência ACID
- Suporte a **row-level locking** (`SELECT ... FOR UPDATE`)
- Ideal para controle de concorrência forte

### Mensageria — RabbitMQ
- Arquitetura orientada a eventos
- Exchanges do tipo `topic`
- Suporte a **ACK/NACK manual**

### Cache / Coordenação — Redis
- Infraestrutura auxiliar
- Base para extensões futuras

### Backend — NestJS + TypeORM
- Arquitetura modular
- Injeção de dependências
- Transações e locking
- Separação clara de responsabilidades (Controller / Use Case / Infra)

### Logging — Pino
- Logging estruturado em JSON
- Níveis: `DEBUG`, `INFO`, `WARN`, `ERROR`

### Documentação da API
- Swagger UI

---

## 3. Como Executar

### Pré-requisitos
- Docker
- Docker Compose

### Subir o ambiente
```bash
docker compose up --build
```

### Serviços disponíveis
- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- RabbitMQ UI: http://localhost:15672 (guest / guest)
- PostgreSQL: localhost:5432

---

#### Popular dados iniciais

Crie uma sessão via API

``` http
POST /sessions
```

``` json
{
  "movie": "Duna 2",
  "startTime": "2026-01-21T20:00:00-03:00",
  "room": "Sala 1",
  "priceCents": 2500,
  "seatCount": 16
}

```

## 4. Estratégias Implementadas

### Como o sistema resolve race conditions?

- Uso de **lock pessimista no banco** (`FOR UPDATE`)
- Assentos e reservas são travados dentro de **transações**
- Apenas uma transação pode reservar ou vender um assento por vez

---

###Coordenação entre múltiplas instâncias

- O PostgreSQL atua como **fonte única de verdade**
- Locks no banco garantem exclusão mútua mesmo com múltiplas instânciasda API
- RabbitMQ permite comunicação assíncrona desacoplada

---

### Prevenção de deadlocks

- Locks são sempre adquiridos na mesma ordem
    1. Reservation
    2. Seats
- Não há `FOR UPDATE` em queries com `JOIN`
- Atualizações em lote (`WHERE id = ANY(...)`)

### 4.1 Diferenciais Implementados
#### Documentação da API
- Swagger/OpenAPI completo com exemplos reais em todos os DTOs
#### Rate Limiting
- Rate limiting global por IP implementado com `@nestjs/throttler` (ex.: 120 req/min).
- Resposta padrão: HTTP 429 (Too Many Requests).


---

## 5. Endpoits da API

#### Criar sessão

``` http
POST /sessions
```

---

#### Consultar assentos

``` http
GET /sessions/{sessionId}/seats
```

---

#### Criar Reserva

``` http
POST /reservations
```

```json
{
  "sessionId": "uuid",
  "userId": "uuid", //50ed9531-4b57-4670-8ae8-d8a72717ccb3 por exemplo
  "seatIds": ["uuid", "uuid"]
}
```

---

#### Confirmar Pagamento

``` http
POST /reservations/{reservationId}/confirm-payment
```

``` json
{
  "paymentRef": "TEST-123"
}
```

---

#### Histórico de Compras

``` http
GET /users/{userId}/purchases
```

---

## 6. Decisões Técnicas Importantes

- Reserva ≠ Venda
    
    Reservas são temporárias; vendas são persistidas em tabela própria (`sales`)

- Eventos de domínio explícitos
    
    Ex.: `reservation.created`, `reservation.expired`, `seat.released`, `payment.confirmed`

- Consumo confiável de eventos
    
    - Fila durável
    - ACK manual
    - Retry via NACK

- Logging estruturado

    Facilita debugging, observabilidade e integração com ferramentas externas

---

## 7. Limitações Conhecidas

- Migrations não foram utilizadas inicialmente (uso de `synchronize: true` em dev)
- Não há autenticação/autorização
- Não há testes automatizados
- Pagamento é simulados
Essas decisões foram tomadas para priorizar o **core do problema proposto**

---

## 8. Melhorias Futuras
- Migrations versionadas com TypeORM
- Testes de concorrência automatizados
- Idempotency-Key no `confirm-payment`
- Dead-letter queues (DLQ)
- Observabilidade com métricas (Prometheus)
- Autenticação JWT
- Frontend para visualização das sessões
