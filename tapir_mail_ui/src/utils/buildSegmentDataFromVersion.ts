import { EmailConfigurationVersion, SegmentData } from "../api_client";

export function buildSegmentDataFromVersion(
  version: EmailConfigurationVersion,
): SegmentData {
  return {
    dynamicSegmentNamesAdditive: version.dynamicSegmentsAdditive ?? [],
    dynamicSegmentNamesSubtractive: version.dynamicSegmentsSubtractive ?? [],
    staticSegmentIdsAdditive: version.staticSegmentsAdditive ?? [],
    staticSegmentIdsSubtractive: version.staticSegmentsSubtractive,
    mailCategoryIdsAdditive: version.mailCategoriesAdditive,
    filterList: version.filterList ?? [],
  };
}
