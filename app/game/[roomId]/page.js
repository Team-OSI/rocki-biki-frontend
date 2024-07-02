'use client'
import { GameCanvas } from "@/components/game/GameCanvas"
import { useParams } from 'next/navigation'

export default function Game() {
    const { roomId } = useParams()
    return (
        <GameCanvas roomId={roomId}/>
    )
}