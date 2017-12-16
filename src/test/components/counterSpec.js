import { isNegative } from "../../js/components/counter";

describe("Counter component", function() {

    it("should identify negative numbers correctly", function() {
        expect(isNegative(-1)).toBe(true);
        expect(isNegative(0)).toBe(false);
        expect(isNegative(1)).toBe(false);
    });

});
