import {
	updateLessonTitle,
	createLessonSection,
	createLessonSectionBlock,
	deleteLessonSection,
	deleteLessonSectionBlock,
	getLessonById,
	getLessonSectionById,
	getLessonBlocksByLessonSectionId,
	swapLessonSectionBlocks,
	updateLessonSection,
	updateLessonSectionBlock,
	getLessonSectionCountByLessonId,
	getLessonSectionsByLessonId
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({
	locals: { security },
	params: { lessonId, sectionId, subjectOfferingId }
}) => {
	security.isAuthenticated();

	let lessonIdInt;
	try {
		lessonIdInt = parseInt(lessonId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const lesson = await getLessonById(lessonIdInt);
	if (!lesson) throw redirect(302, '/dashboard');

	let sectionIdInt;
	try {
		sectionIdInt = parseInt(sectionId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const section = await getLessonSectionById(sectionIdInt);
	if (!section) throw redirect(302, '/dashboard');

	const sections = await getLessonSectionsByLessonId(lessonIdInt);

	const blocks = await getLessonBlocksByLessonSectionId(sectionIdInt);

	return { lesson, section, sections, blocks, subjectOfferingId };
};

export const actions = {
	updateLessonTitle: async (event) => {
		const formData = await event.request.formData();
		const lessonId = formData.get('lessonId');
		const title = formData.get('title');

		if (!lessonId || !title) {
			return fail(400, { message: 'Lesson ID and title are required' });
		}
		if (typeof lessonId !== 'string' || typeof title !== 'string') {
			return fail(400, { message: 'Invalid input types' });
		}

		let lessonIdInt;
		try {
			lessonIdInt = parseInt(lessonId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson ID' });
		}

		await updateLessonTitle(lessonIdInt, title);
	},
	createBlock: async (event) => {
		const formData = await event.request.formData();

		const lessonSectionId = formData.get('lessonSectionId');
		const type = formData.get('type');
		const content = formData.get('content');

		if (!lessonSectionId || !type || !content) {
			return fail(400, { message: 'All fields are required' });
		}

		if (
			typeof lessonSectionId !== 'string' ||
			typeof type !== 'string' ||
			typeof content !== 'string'
		) {
			return fail(400, { message: 'Invalid input types' });
		}

		let lessonSectionIdInt;
		try {
			lessonSectionIdInt = parseInt(lessonSectionId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson section ID' });
		}

		const block = await createLessonSectionBlock(lessonSectionIdInt, type, content);
		return block;
	},

	updateBlock: async (event) => {
		const formData = await event.request.formData();

		const blockId = formData.get('blockId');
		const content = formData.get('content');
		const type = formData.get('type');

		if (!blockId) {
			return fail(400, { message: 'Block ID is required' });
		}

		if (typeof blockId !== 'string') {
			return fail(400, { message: 'Invalid block ID type' });
		}

		let blockIdInt;
		try {
			blockIdInt = parseInt(blockId, 10);
		} catch {
			return fail(400, { message: 'Invalid block ID' });
		}

		const updates: { content?: unknown; type?: string } = {};
		if (content !== null && typeof content === 'string') updates.content = content;
		if (type !== null && typeof type === 'string') updates.type = type;

		await updateLessonSectionBlock(blockIdInt, updates);
	},

	deleteBlock: async (event) => {
		const formData = await event.request.formData();

		const blockId = formData.get('blockId');

		if (!blockId || typeof blockId !== 'string') {
			return fail(400, { message: 'Invalid block ID' });
		}

		let blockIdInt;
		try {
			blockIdInt = parseInt(blockId, 10);
		} catch {
			return fail(400, { message: 'Invalid block ID' });
		}

		await deleteLessonSectionBlock(blockIdInt);
	},

	swapBlocks: async (event) => {
		const formData = await event.request.formData();
		const blockOneId = formData.get('blockOneId');
		const blockTwoId = formData.get('blockTwoId');
		const blockOneIndex = formData.get('blockOneIndex');
		const blockTwoIndex = formData.get('blockTwoIndex');

		if (!blockOneId || !blockTwoId || blockOneIndex === null || blockTwoIndex === null) {
			return fail(400, { message: 'Block IDs and indices are required' });
		}

		if (
			typeof blockOneId !== 'string' ||
			typeof blockTwoId !== 'string' ||
			typeof blockOneIndex !== 'string' ||
			typeof blockTwoIndex !== 'string'
		) {
			return fail(400, { message: 'Invalid input types' });
		}

		let blockOneIdInt;
		let blockTwoIdInt;
		let blockOneIndexInt;
		let blockTwoIndexInt;
		try {
			blockOneIdInt = parseInt(blockOneId, 10);
			blockTwoIdInt = parseInt(blockTwoId, 10);
			blockOneIndexInt = parseInt(blockOneIndex, 10);
			blockTwoIndexInt = parseInt(blockTwoIndex, 10);
		} catch {
			return fail(400, { message: 'Invalid block IDs or indices' });
		}

		await swapLessonSectionBlocks(blockOneIdInt, blockTwoIdInt, blockOneIndexInt, blockTwoIndexInt);
	},

	createSection: async (event) => {
		const formData = await event.request.formData();

		const lessonId = formData.get('lessonId');
		const title = formData.get('title');

		if (!lessonId || !title) {
			return fail(400, { message: 'Lesson ID and title are required' });
		}

		if (typeof lessonId !== 'string' || typeof title !== 'string') {
			return fail(400, { message: 'Invalid input types' });
		}

		let lessonIdInt;
		try {
			lessonIdInt = parseInt(lessonId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson ID' });
		}

		await createLessonSection(lessonIdInt, title);
	},

	updateSection: async (event) => {
		const formData = await event.request.formData();

		const sectionId = formData.get('sectionId');
		const title = formData.get('title');

		if (!sectionId || !title) {
			return fail(400, { message: 'Section ID and title are required' });
		}

		if (typeof sectionId !== 'string' || typeof title !== 'string') {
			return fail(400, { message: 'Invalid input types' });
		}

		let sectionIdInt;
		try {
			sectionIdInt = parseInt(sectionId, 10);
		} catch {
			return fail(400, { message: 'Invalid section ID' });
		}

		await updateLessonSection(sectionIdInt, title);
	},

	deleteSection: async (event) => {
		const formData = await event.request.formData();

		const lessonId = formData.get('lessonId');
		const sectionId = formData.get('sectionId');

		if (!lessonId || !sectionId) {
			return fail(400, { message: 'Lesson ID and Section ID are required' });
		}

		if (typeof lessonId !== 'string' || typeof sectionId !== 'string') {
			return fail(400, { message: 'Invalid input types' });
		}

		let sectionIdInt;
		try {
			sectionIdInt = parseInt(sectionId, 10);
		} catch {
			return fail(400, { message: 'Invalid section ID' });
		}

		let lessonIdInt;
		try {
			lessonIdInt = parseInt(lessonId, 10);
		} catch {
			return fail(400, { message: 'Invalid lesson ID' });
		}

		const count = await getLessonSectionCountByLessonId(lessonIdInt);

		if (count <= 1) {
			return fail(400, { message: 'Cannot delete the last section of a lesson' });
		}

		await deleteLessonSection(sectionIdInt);
	},

	getBlocks: async (event) => {
		const formData = await event.request.formData();
		const sectionId = formData.get('sectionId');

		if (!sectionId || typeof sectionId !== 'string') {
			return fail(400, { message: 'Section ID is required' });
		}

		let sectionIdInt;
		try {
			sectionIdInt = parseInt(sectionId, 10);
		} catch {
			return fail(400, { message: 'Invalid section ID' });
		}

		const blocks = await getLessonBlocksByLessonSectionId(sectionIdInt);
		return { blocks };
	}
};
