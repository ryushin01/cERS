import { Typography } from "@components/common";
import { Label } from "@components/form";
import { useResponsive } from "@hooks";

type FileIndicatorProps = {
  total?: number;
  count?: number;
};

/**
 * @name FileIndicator
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {number} total     - 최대 파일 업로드 개수
 * @property {number} count     - 현재까지 업로드된 파일 개수
 */

export default function FileIndicator({ total, count }: FileIndicatorProps) {
  const { isDesktop } = useResponsive();

  return (
    <div className="_file-indicator">
      <Label required={true} labelText="파일 업로드" />
      <>
        <Typography
          kind={isDesktop ? "headline-small" : "body-large"}
          isBold={true}
          className="ml-2 text-ers-main-100"
        >
          {count}
        </Typography>
        <Typography
          kind={isDesktop ? "headline-small" : "body-large"}
          className="text-ers-grayscale-90"
        >
          /{total}
        </Typography>
      </>
    </div>
  );
}
