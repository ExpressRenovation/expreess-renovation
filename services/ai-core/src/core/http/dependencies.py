from fastapi import Depends
from src.budget.infrastructure.adapters.ai.gemini_adapter import GoogleGenerativeAIAdapter
from src.budget.infrastructure.adapters.databases.firestore_price_book import FirestorePriceBookAdapter
from src.budget.infrastructure.adapters.databases.firestore_budget import FirestoreBudgetRepository
from src.budget.infrastructure.events.firestore_emitter import FirestoreProgressEmitter
from src.budget.application.use_cases.restructure_budget_uc import RestructureBudgetUseCase

# Singletons for connections
_llm_adapter = GoogleGenerativeAIAdapter()
_vector_search_adapter = FirestorePriceBookAdapter()
_firestore_repository = FirestoreBudgetRepository()
_progress_emitter = FirestoreProgressEmitter()

def get_restructure_budget_uc() -> RestructureBudgetUseCase:
    """Dependency Injection for the core AI Budget Use Case."""
    return RestructureBudgetUseCase(
        llm_provider=_llm_adapter,
        vector_search=_vector_search_adapter,
        emitter=_progress_emitter,
        repository=_firestore_repository
    )
