import { describe, it, expect, vi, afterEach } from "vitest";
import { deriveSeatStatus } from "./deriveSeatStatus";

// 테스트에서 반복되는 기준값
const MY_ID = "user-123";
const OTHER_ID = "user-456";
const NOW = new Date("2025-01-01T12:00:00Z");
const FUTURE = "2025-01-01T12:10:00Z"; // 현재보다 10분 뒤
const PAST = "2025-01-01T11:50:00Z"; // 현재보다 10분 전
const EXACT_NOW = "2025-01-01T12:00:00Z"; // 현재와 정확히 같음

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deriveSeatStatus", () => {
  it("1. isSold가 true면 sold를 반환한다", () => {
    const result = deriveSeatStatus(
      { isSold: true, holderId: null, expiresAt: null },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "sold" });
  });

  it("2. isSold가 true이고 holderId도 있으면 sold를 반환한다 (판정 순서 검증)", () => {
    const result = deriveSeatStatus(
      { isSold: true, holderId: OTHER_ID, expiresAt: FUTURE },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "sold" });
  });

  it("3. holderId가 null이면 available을 반환한다", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: null, expiresAt: null },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "available" });
  });

  it("4. 유효한 선점이고 holderId가 내 식별자면 held-by-me를 반환하고 expiresAt을 포함한다", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: MY_ID, expiresAt: FUTURE },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "held-by-me", expiresAt: FUTURE });
  });

  it("5. 유효한 선점이고 holderId가 남의 식별자면 held-by-other를 반환한다", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: OTHER_ID, expiresAt: FUTURE },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "held-by-other" });
  });

  it("6. expiresAt이 현재보다 과거면 holderId가 있어도 available을 반환한다", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: OTHER_ID, expiresAt: PAST },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "available" });
  });

  it("7. 내가 선점했지만 만료됐으면 available을 반환한다", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: MY_ID, expiresAt: PAST },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "available" });
  });

  it("8. expiresAt이 현재와 정확히 같으면 available을 반환한다 (만료로 취급)", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: OTHER_ID, expiresAt: EXACT_NOW },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "available" });
  });

  it("9. holderId가 있고 expiresAt이 null이면 held-by-other를 반환하고 경고를 남긴다", () => {
    const warn = vi.spyOn(console, "warn");
    const result = deriveSeatStatus(
      { isSold: false, holderId: OTHER_ID, expiresAt: null },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "held-by-other" });
    expect(warn).toHaveBeenCalledOnce();
  });

  it("10. holderId가 null이고 expiresAt이 있으면 available을 반환한다", () => {
    const result = deriveSeatStatus(
      { isSold: false, holderId: null, expiresAt: FUTURE },
      MY_ID,
      NOW,
    );
    expect(result).toEqual({ status: "available" });
  });
});
