import { isEven, isNegative } from "../js/components/counter";

describe("Counter component", function(){

    it("should identify even numbers correctly", function(){
        expect(isEven(-1)).toBe(false);
        expect(isEven(0)).toBe(true);
        expect(isEven(2)).toBe(true);
    });

    it("should identify negative numbers correctly", function(){
        expect(isNegative(-1)).toBe(true);
        expect(isNegative(0)).toBe(false);
        expect(isNegative(1)).toBe(false);
    });

});
