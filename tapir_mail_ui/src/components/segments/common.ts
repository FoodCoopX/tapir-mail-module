enum ElementType {
  Filter,
  Operator,
  OpenBracket,
  CloseBracket,
  Not,
}

type FilterElement = {
  value: string;
  elementType: ElementType;
};

const getBorderRadiusByIdx = (
  idx: number,
  length: number,
  canStart: boolean = true,
  canEnd: boolean = true,
) => {
  const isFirst = canStart && idx === 0;
  const isLast = canEnd && idx === length - 1;

  return {
    borderTopLeftRadius: isFirst ? 6 : 0,
    borderBottomLeftRadius: isFirst ? 6 : 0,
    borderTopRightRadius: isLast ? 6 : 0,
    borderBottomRightRadius: isLast ? 6 : 0,
  };
};

const guessElementType = (value: string): ElementType => {
  switch (value) {
    case "AND":
    case "OR":
      return ElementType.Operator;
    case "(":
      return ElementType.OpenBracket;
    case ")":
      return ElementType.CloseBracket;
    case "NOT":
      return ElementType.Not;
    default:
      return ElementType.Filter;
  }
};

export {
  getBorderRadiusByIdx,
  guessElementType,
  ElementType,
  type FilterElement,
};
