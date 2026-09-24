# 기술 현황

> 2026-09-25 보관 기준. t0.3 계약은 과거 구현 방향의 기준이며 추가 개발 예정은 없습니다.

## 실제 코드

Next.js 16.3.2, React 19.2.8, TypeScript 5.9.3, React Three Fiber 9.7.0, Three.js 0.182.0과 pnpm 11.22.0 잠금 파일이 있습니다. 브라우저 한 대에서 동작하는 fixture 훈련판, 3D 기본 도형 도시, 50초·10초·5초 로컬 흐름, 결정적 seed·규칙 판정 slice가 구현됐습니다. 정적 GitHub Pages 출력은 서버 없이 이 훈련판을 제공하기 위한 것입니다.

## 구현하지 않은 것

- 1대1 온라인 서버와 권위 있는 턴·난수·시간·정보 판정
- 계정, 방·초대 링크의 실제 API, 영속 저장, 재접속, 두 클라이언트 동기화
- Supabase 스키마·Auth·Realtime 및 애플리케이션 연결
- Vercel 프로젝트와 배포
- 최종 3D 모델·사운드와 정식 물리 기기 검증

이전 기술 준비의 도구·계정·비용·배포 경계 상세는 [t0.3 보존본](../archive/2026-09-25/TECHNICAL_READINESS_t0.3.md)에서 확인할 수 있습니다. 그 문서의 프로젝트 상태와 승인 경계는 2026-08-23 기록이며 현재 상태는 [CURRENT_STAGE.md](../CURRENT_STAGE.md)가 소유합니다. 서버 재개 경로는 [개발 재개 계획](../production/FUTURE_DEVELOPMENT_PLAN.md)에 정리했습니다.
