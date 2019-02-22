const isArray = Array.isArray;
const keyList = Object.keys;
const hasProp = Object.prototype.hasOwnProperty;

export default function equal(a, b) {
	if (a === b) {
		return true;
	}

	if (a && b && typeof a === 'object' && typeof b === 'object') {
		const arrA = isArray(a);
		const arrB = isArray(b);

		if (arrA && arrB) {
			const length = a.length;
			if (length !== b.length) {
				return false;
			}
			for (let i = length - 1; i >= 0; i--) {
				if (!equal(a[i], b[i])) {
					return false;
				}
			}
			return true;
		}

		if (arrA !== arrB) {
			return false;
		}

		const keys = keyList(a);
		const length = keys.length;

		if (length !== keyList(b).length) {
			return false;
		}

		for (let i = length - 1; i >= 0; i--) {
			if (!hasProp.call(b, keys[i])) {
				return false;
			}
		}

		for (let i = length - 1; i >= 0; i--) {
			const key = keys[i];
			if (!equal(a[key], b[key])) {
				return false;
			}
		}

		return true;
	}

	return a !== a && b !== b;
};
