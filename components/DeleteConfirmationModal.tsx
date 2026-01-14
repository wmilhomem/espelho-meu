"use client"

import type React from "react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (strategy: "keep-history" | "delete-all") => void
  title: string
  message: string
  itemType: "job" | "asset"
  dependencyCount: number
  isDeleting: boolean
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemType,
  dependencyCount,
  isDeleting,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#05010a]/90 backdrop-blur-md transition-opacity"
        onClick={() => !isDeleting && onClose()}
      ></div>

      <div className="relative w-full max-w-md bg-[#1a0b2e] border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden animate-[zoomIn_0.2s_ease-out]">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6">{message}</p>

          {itemType === "asset" && dependencyCount > 0 && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Atenção</p>
              <p className="text-gray-300 text-xs">
                Este item é usado em <strong className="text-white">{dependencyCount} looks</strong> criados.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {itemType === "asset" && dependencyCount > 0 ? (
              <>
                <button
                  onClick={() => onConfirm("keep-history")}
                  disabled={isDeleting}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? "Processando..." : "Excluir item (Manter histórico)"}
                </button>
                <button
                  onClick={() => onConfirm("delete-all")}
                  disabled={isDeleting}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
                >
                  {isDeleting ? "Processando..." : "Excluir TUDO (Item + Looks)"}
                </button>
              </>
            ) : (
              <button
                onClick={() => onConfirm("delete-all")}
                disabled={isDeleting}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
              >
                {isDeleting ? "Processando..." : "Confirmar Exclusão"}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isDeleting}
              className="mt-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
