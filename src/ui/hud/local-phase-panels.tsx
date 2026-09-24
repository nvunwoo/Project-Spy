import { CheckCircle2, Dice5, Eye, FastForward, RotateCcw } from "lucide-react";

import type { AgentState, Team } from "@/domain/model/game-types";
import type { GeneralOrder, MoleOrder } from "@/domain/orders/order-types";
import { isMoleColleagueAssassinationUnlocked } from "@/domain/orders/order-rules";
import {
  DEFAULT_LOCAL_MATCH_SEED,
  rosterPlacementCandidates,
} from "@/fixtures/local-turn-fixture";
import { toGridLabel } from "@/presentation-3d/coordinates/logical-to-world";
import { Button } from "@/ui/primitives/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/ui/primitives/panel";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function RosterPlacementDock(props: {
  readonly seed: string;
  readonly selectedFacilityId: string | null;
  readonly onSeedChange: (seed: string) => void;
  readonly onCreateSeed: () => void;
  readonly onResetSeed: () => void;
  readonly onSelect: (facilityId: string) => void;
  readonly onConfirm: () => void;
}) {
  return (
    <section className="roster-placement-dock" aria-labelledby="roster-title">
      <header>
        <div>
          <span>첫 명령 전 비공개 선택</span>
          <h2 id="roster-title">요원 명단 은닉</h2>
        </div>
      </header>
      <div className="roster-placement-dock__content">
        <p className="phase-panel__lead">
          지도에서 초록색으로 깜빡이는 호텔 또는 지하철역을 직접 누르십시오.
          상대의 위치는 공개되지 않습니다.
        </p>
        <details className="roster-seed-settings">
          <summary>훈련 시드 설정</summary>
          <div className="seed-control">
            <label className="seed-field">
              <span>훈련 시드</span>
              <input
                value={props.seed}
                maxLength={48}
                onChange={(event) => props.onSeedChange(event.target.value)}
                aria-label="훈련 시드"
              />
            </label>
            <div className="seed-actions" aria-label="훈련 시드 도구">
              <Button
                type="button"
                variant="outline"
                onClick={props.onCreateSeed}
              >
                <Dice5 aria-hidden="true" /> 새 시드 만들기
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={props.seed === DEFAULT_LOCAL_MATCH_SEED}
                onClick={props.onResetSeed}
              >
                <RotateCcw aria-hidden="true" /> 기본 시드 복원
              </Button>
            </div>
            <p className="seed-note">
              같은 시드와 같은 명령은 같은 판정 결과를 만듭니다.
            </p>
          </div>
        </details>
        <p className="roster-placement-dock__selection" role="status">
          {props.selectedFacilityId
            ? `선택됨 · ${props.selectedFacilityId}`
            : "아직 건물을 선택하지 않았습니다."}
        </p>
        <details className="roster-accessibility-list">
          <summary>지도 은닉 건물 접근성 목록</summary>
          <div aria-label="은닉 가능 건물">
            {rosterPlacementCandidates.map((candidate) => (
              <button
                key={candidate.facilityId}
                type="button"
                aria-pressed={candidate.facilityId === props.selectedFacilityId}
                aria-label={`${candidate.label} 명단 은닉 위치 선택`}
                onClick={() => props.onSelect(candidate.facilityId)}
              >
                <span>{candidate.label}</span>
                <small>{toGridLabel(candidate.coordinate)}</small>
              </button>
            ))}
          </div>
        </details>
        <Button
          type="button"
          className="phase-panel__primary"
          disabled={!props.selectedFacilityId || props.seed.trim().length === 0}
          onClick={props.onConfirm}
        >
          <CheckCircle2 aria-hidden="true" /> 이 위치에 은닉
        </Button>
      </div>
    </section>
  );
}

export function GeneralOrderControlDock(props: {
  readonly draftedAgents: number;
  readonly activeAgents: number;
  readonly draftCost: number;
  readonly availableFunds: number;
  readonly canLock: boolean;
  readonly onLock: () => void;
}) {
  return (
    <section className="turn-control-dock" aria-label="일반 명령 확정">
      <div>
        <span>
          명령 {props.draftedAgents}/{props.activeAgents}
        </span>
        <strong>{money.format(props.draftCost)}</strong>
        <small>남은 자금 {money.format(props.availableFunds)}</small>
      </div>
      <Button type="button" disabled={!props.canLock} onClick={props.onLock}>
        <FastForward aria-hidden="true" />
        {props.canLock
          ? "미지정 요원 대기 · 명령 확정"
          : "명령 작성을 먼저 완료"}
      </Button>
    </section>
  );
}

function orderSummary(order: GeneralOrder | undefined): string {
  if (!order) return "대기";
  if (order.kind === "WAIT") return "대기";
  if (order.kind === "INTERROGATE") return "심문";
  if (order.kind === "PURGE") return "숙청";
  const movement =
    order.path.length > 0 ? `${order.path.length}칸 이동 · ` : "";
  const action = {
    MOVE_ONLY: "이동만",
    INVESTIGATE: "조사",
    HACK: "해킹",
    ASSASSINATE: "암살",
  }[order.arrivalAction.kind];
  return `${movement}${action}`;
}

export function MoleOrderPanel(props: {
  readonly controller: Team;
  readonly mole: AgentState;
  readonly nominalOrder: GeneralOrder | undefined;
  readonly colleagues: readonly AgentState[];
  readonly availableFunds: number;
  readonly turn: number;
  readonly onChoose: (order: MoleOrder) => void;
}) {
  const colleagueAssassinationUnlocked = isMoleColleagueAssassinationUnlocked(
    props.turn,
  );
  const canFailMove =
    props.nominalOrder?.kind === "OPERATE" &&
    props.nominalOrder.path.length > 0;
  const canFailOperation =
    props.nominalOrder?.kind === "OPERATE" &&
    props.nominalOrder.arrivalAction.kind !== "MOVE_ONLY";
  return (
    <Panel className="phase-panel mole-order-panel">
      <PanelHeader>
        <div>
          <span>10초 비공개 단계</span>
          <PanelTitle>배신자 명령 · 요원 {props.mole.role}</PanelTitle>
        </div>
      </PanelHeader>
      <PanelContent>
        <div className="mole-order-brief">
          <Eye aria-hidden="true" />
          <span>
            명목상 명령
            <strong>{orderSummary(props.nominalOrder)}</strong>
          </span>
        </div>
        <div className="command-grid">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              props.onChoose({
                kind: "ACQUIESCE",
                moleAgentId: props.mole.id,
              })
            }
          >
            묵인 · $0
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canFailMove}
            onClick={() =>
              props.onChoose({
                kind: "FORCE_MOVE_FAILURE",
                moleAgentId: props.mole.id,
              })
            }
          >
            이동 실패 · $0
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canFailOperation}
            onClick={() =>
              props.onChoose({
                kind: "FORCE_OPERATION_FAILURE",
                moleAgentId: props.mole.id,
              })
            }
          >
            공작 실패 · $0
          </Button>
          {!colleagueAssassinationUnlocked ? (
            <Button type="button" variant="dangerous" disabled>
              동료 암살 · 6턴부터 사용 가능
            </Button>
          ) : props.colleagues.length === 0 ? (
            <Button type="button" variant="dangerous" disabled>
              동료 암살 · 대상 없음
            </Button>
          ) : (
            props.colleagues.map((colleague) => (
              <Button
                key={colleague.id}
                type="button"
                variant="dangerous"
                disabled={props.availableFunds < 2_500}
                onClick={() =>
                  props.onChoose({
                    kind: "ASSASSINATE_COLLEAGUE",
                    moleAgentId: props.mole.id,
                    targetAgentId: colleague.id,
                  })
                }
              >
                요원 {colleague.role} 동료 암살 · $2,500
              </Button>
            ))
          )}
        </div>
        <p className="command-note command-note--warning">
          확정하지 않으면 묵인합니다. 동료 암살은 원래 이동과 공작을 모두
          실패시키며 1~5턴에는 사용할 수 없습니다.
        </p>
      </PanelContent>
    </Panel>
  );
}
