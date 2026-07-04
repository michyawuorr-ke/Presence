reeti Architecture

> Oreeti is a Human Opportunity Engine.
>
> This documentation explains how the platform is designed, why it is designed that way, and how it should evolve over time.

---

## Purpose

The architecture documentation exists to preserve engineering knowledge.

It explains the reasoning behind the system, records major architectural decisions, documents the evolution of the platform, and provides a shared reference for every engineer who contributes to Oreeti.

The objective is not simply to explain the codebase. It is to explain the system.

---

## Philosophy

Every feature in Oreeti exists for one purpose:

> Help people discover meaningful opportunities through real human interaction.

That purpose should remain visible in every architectural decision.

Technology is an implementation detail.

Opportunity is the product.

---

# Architecture Documents

## 00 — Product Architecture

Defines Oreeti as a platform.

Explains the Human Opportunity Engine, the major platform layers, and how every subsystem contributes to creating opportunities.

---

## 01 — Engineering Architecture

Describes how the codebase is organised.

Defines module boundaries, responsibilities, feature ownership, dependency rules, and engineering principles.

---

## 02 — Entry System

Documents the complete guest and host entry experience.

Includes onboarding, profile bootstrapping, returning users, scene loading, and event access.

---

## 03 — Networking Engine

Explains how people discover each other, connect, unlock profiles, exchange Mental Cards, and continue relationships beyond events.

---

## 04 — Identity System

Defines persistent identity across Oreeti.

Documents hosts, guests, master profiles, presence, Mental Cards, and event-specific identities.

---

## 05 — AI Layer

Documents every intelligent system within Oreeti.

Includes matching, recommendations, opportunity discovery, AI concierge capabilities, and future autonomous agents.

---

## 06 — Roadmap

Engineering roadmap for the platform.

Documents planned architecture, future milestones, and long-term technical direction.

---

## 07 — Architecture Decisions

Records important engineering decisions and the reasoning behind them.

Every significant architectural change should be documented before future work continues.

---

## 08 — Milestones

Historical engineering timeline.

Each milestone records:

- What changed
- Why it changed
- Production status
- Lessons learned
- Next milestone

---

## 09 — Database

Documents the platform's persistent data model.

Includes tables, relationships, ownership, constraints, and feature boundaries.

---

# Engineering Principles

Every architectural decision should preserve these principles.

- Product vision comes before implementation.
- Pages orchestrate. Features own business logic.
- Every module has a single responsibility.
- Persistent identity is separate from event participation.
- Production stability is never sacrificed for refactoring.
- Architecture should become simpler as the platform grows.
- Documentation evolves alongside the code.

---

# Reading Order

For new engineers:

1. Product Architecture
2. Engineering Architecture
3. Entry System
4. Identity System
5. Networking Engine
6. AI Layer
7. Database
8. Architecture Decisions
9. Roadmap

---

# Living Documentation

These documents are part of the codebase.

Every architectural change should update the relevant document before the work is considered complete.

Documentation is not written after the architecture.

Documentation is part of the architecture.

